import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { PronunciationAttempt } from './entities/pronunciation-attempt.entity';
import { VoiceSample } from './entities/voice-sample.entity';
import { Sentence } from '../vocabulary/entities/sentence.entity';
import { PronunciationService } from './services/pronunciation.service';
import { AudioProcessingService } from './services/audio-processing.service';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @InjectRepository(PronunciationAttempt)
    private pronunciationAttemptRepository: Repository<PronunciationAttempt>,
    @InjectRepository(VoiceSample)
    private voiceSampleRepository: Repository<VoiceSample>,
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
    private configService: ConfigService,
    private pronunciationService: PronunciationService,
    private audioProcessingService: AudioProcessingService,
  ) {}

  async analyzePronunciation(
    userId: string,
    sentenceId: string,
    audioBuffer: Buffer,
  ): Promise<any> {
    try {
      const sentence = await this.sentenceRepository.findOne({ where: { id: sentenceId } });
      if (!sentence) {
        throw new Error('Sentence not found');
      }

      // Process audio
      const processedAudio = await this.audioProcessingService.processAudioFile(audioBuffer);
      const features = await this.audioProcessingService.extractAudioFeatures(processedAudio);

      // Analyze pronunciation
      const analysis = await this.pronunciationService.analyzePronunciation(
        processedAudio,
        sentence.englishText,
      );

      // Save pronunciation attempt
      const attempt = this.pronunciationAttemptRepository.create({
        user: { id: userId } as User,
        sentence,
        sessionId: this.generateSessionId(),
        attemptNumber: await this.getNextAttemptNumber(userId, sentenceId),
        targetText: sentence.englishText,
        userTranscript: analysis.transcription,
        analysisResults: analysis.analysis,
        overallScore: analysis.overallScore,
        phonemeScores: analysis.analysis.wordScores,
        wordScores: analysis.analysis.wordScores,
        timingAnalysis: analysis.analysis.timing,
        errorAnalysis: this.generateErrorAnalysis(analysis.analysis),
        audioFileUrl: await this.saveAudioFile(processedAudio, userId, sentenceId),
        feedbackText: analysis.feedback,
      });

      await this.pronunciationAttemptRepository.save(attempt);

      // Save voice sample
      const voiceSample = this.voiceSampleRepository.create({
        user: { id: userId } as User,
        sentence,
        sessionId: attempt.sessionId,
        sampleType: 'pronunciation_attempt',
        audioFileUrl: attempt.audioFileUrl,
        transcription: analysis.transcription,
        audioFeatures: features,
        qualityMetrics: await this.audioProcessingService.calculateAudioQuality(processedAudio),
      });

      await this.voiceSampleRepository.save(voiceSample);

      return {
        attemptId: attempt.id,
        overallScore: attempt.overallScore,
        feedback: attempt.feedbackText,
        analysis: attempt.analysisResults,
        transcription: attempt.userTranscript,
      };
    } catch (error) {
      this.logger.error(`Pronunciation analysis failed: ${error.message}`);
      throw new Error('Failed to analyze pronunciation');
    }
  }

  async getPracticeHistory(userId: string, limit: number = 20): Promise<any[]> {
    const attempts = await this.pronunciationAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['sentence'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return attempts.map(attempt => ({
      id: attempt.id,
      sentence: attempt.sentence.englishText,
      arabicTranslation: attempt.sentence.arabicTranslation,
      score: attempt.overallScore,
      transcription: attempt.userTranscript,
      feedback: attempt.feedbackText,
      date: attempt.createdAt,
    }));
  }

  async getProgressReport(userId: string): Promise<any> {
    const attempts = await this.pronunciationAttemptRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        progressTrend: 0,
        recommendations: [],
      };
    }

    const scores = attempts.map(a => a.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);

    // Calculate progress trend
    const recentScores = scores.slice(-10);
    const olderScores = scores.slice(-20, -10);
    const progressTrend = this.calculateProgressTrend(recentScores, olderScores);

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(averageScore),
      bestScore,
      progressTrend,
      recommendations: this.generatePronunciationRecommendations(attempts),
    };
  }

  async generatePracticeSession(userId: string, difficulty: string = 'medium'): Promise<any> {
    // Get user's recent performance
    const recentAttempts = await this.pronunciationAttemptRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Select sentences based on difficulty and user performance
    const sentences = await this.selectPracticeSentences(difficulty, recentAttempts);

    return {
      sessionId: this.generateSessionId(),
      sentences: sentences.map(s => ({
        id: s.id,
        text: s.englishText,
        arabicTranslation: s.arabicTranslation,
        audioUrl: s.audioUrlUs || s.audioUrlUk,
      })),
      instructions: this.getPracticeInstructions(difficulty),
    };
  }

  async saveVoiceSample(
    userId: string,
    sampleType: string,
    audioBuffer: Buffer,
    metadata?: any,
  ): Promise<VoiceSample> {
    try {
      const processedAudio = await this.audioProcessingService.processAudioFile(audioBuffer);
      const features = await this.audioProcessingService.extractAudioFeatures(processedAudio);
      const quality = await this.audioProcessingService.calculateAudioQuality(processedAudio);

      const voiceSample = this.voiceSampleRepository.create({
        user: { id: userId } as User,
        sessionId: this.generateSessionId(),
        sampleType,
        audioFileUrl: await this.saveAudioFile(processedAudio, userId, sampleType),
        transcription: metadata?.transcription || '',
        audioFeatures: features,
        qualityMetrics: quality,
      });

      return await this.voiceSampleRepository.save(voiceSample);
    } catch (error) {
      this.logger.error(`Failed to save voice sample: ${error.message}`);
      throw new Error('Failed to save voice sample');
    }
  }

  private async getNextAttemptNumber(userId: string, sentenceId: string): Promise<number> {
    const count = await this.pronunciationAttemptRepository.count({
      where: {
        user: { id: userId },
        sentence: { id: sentenceId },
      },
    });
    return count + 1;
  }

  private async selectPracticeSentences(difficulty: string, recentAttempts: any[]): Promise<Sentence[]> {
    // This would implement intelligent sentence selection based on:
    // - User's recent performance
    // - Difficulty level
    // - Areas needing improvement
    // - Variety of phonemes and sounds

    const difficultyLevels = {
      easy: ['A1', 'A2'],
      medium: ['B1', 'B2'],
      hard: ['C1', 'C2'],
    };

    const targetLevels = difficultyLevels[difficulty] || ['A1', 'A2'];

    return this.sentenceRepository.find({
      where: {
        cefrLevel: { $in: targetLevels },
        isActive: true,
      },
      order: { usageCount: 'ASC' },
      take: 10,
    });
  }

  private getPracticeInstructions(difficulty: string): string {
    const instructions = {
      easy: 'Practice these simple sentences. Focus on clear pronunciation and correct stress.',
      medium: 'Practice these sentences with natural rhythm. Pay attention to linking sounds.',
      hard: 'Practice these challenging sentences. Focus on difficult sounds and intonation.',
    };

    return instructions[difficulty] || instructions.medium;
  }

  private calculateProgressTrend(recentScores: number[], olderScores: number[]): number {
    if (recentScores.length === 0 || olderScores.length === 0) return 0;

    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    return recentAvg - olderAvg;
  }

  private generateErrorAnalysis(analysis: any): any {
    const errors: any[] = [];

    analysis.wordScores.forEach((word: any) => {
      if (word.score < 0.8) {
        errors.push({
          type: 'pronunciation',
          word: word.targetWord,
          issue: 'Incorrect pronunciation',
          suggestion: 'Practice this word slowly and listen to the correct pronunciation',
        });
      }
    });

    if (analysis.timing.speedRatio > 1.5) {
      errors.push({
        type: 'speed',
        issue: 'Speaking too fast',
        suggestion: 'Slow down your speech for better clarity',
      });
    } else if (analysis.timing.speedRatio < 0.5) {
      errors.push({
        type: 'speed',
        issue: 'Speaking too slow',
        suggestion: 'Try to speak with more natural rhythm',
      });
    }

    return {
      errors,
      totalErrors: errors.length,
      severity: errors.length > 3 ? 'high' : errors.length > 1 ? 'medium' : 'low',
    };
  }

  private generatePronunciationRecommendations(attempts: any[]): string[] {
    const recommendations: string[] = [];

    if (attempts.length === 0) {
      return ['Start with basic pronunciation exercises to build confidence.'];
    }

    const averageScore = attempts.reduce((sum, a) => sum + a.overallScore, 0) / attempts.length;

    if (averageScore < 60) {
      recommendations.push('Focus on basic pronunciation patterns and practice regularly.');
    } else if (averageScore < 80) {
      recommendations.push('Work on specific sounds that are challenging for Arabic speakers.');
    } else {
      recommendations.push('Practice advanced pronunciation techniques and intonation.');
    }

    // Check for specific patterns
    const lowScores = attempts.filter(a => a.overallScore < 70);
    if (lowScores.length > attempts.length * 0.3) {
      recommendations.push('Consider working with a pronunciation coach for personalized feedback.');
    }

    return recommendations;
  }

  private async saveAudioFile(audioBuffer: Buffer, userId: string, identifier: string): Promise<string> {
    // This would implement actual file saving to cloud storage
    // For now, return a mock URL
    const filename = `pronunciation_${userId}_${identifier}_${Date.now()}.mp3`;
    return `https://storage.example.com/audio/${filename}`;
  }

  private generateSessionId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}