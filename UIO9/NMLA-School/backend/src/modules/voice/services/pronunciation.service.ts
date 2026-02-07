import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Injectable()
export class PronunciationService {
  private readonly logger = new Logger(PronunciationService.name);
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;

  constructor(private configService: ConfigService) {
    this.speechClient = new SpeechClient({
      projectId: this.configService.get<string>('GOOGLE_CLOUD_PROJECT'),
      keyFilename: this.configService.get<string>('GOOGLE_CLOUD_KEY_FILE'),
    });

    this.ttsClient = new TextToSpeechClient({
      projectId: this.configService.get<string>('GOOGLE_CLOUD_PROJECT'),
      keyFilename: this.configService.get<string>('GOOGLE_CLOUD_KEY_FILE'),
    });
  }

  async analyzePronunciation(
    audioBuffer: Buffer,
    targetText: string,
    languageCode: string = 'en-US',
  ): Promise<any> {
    try {
      // Transcribe user audio
      const transcription = await this.transcribeAudio(audioBuffer, languageCode);
      
      // Analyze pronunciation accuracy
      const analysis = await this.comparePronunciation(
        transcription,
        targetText,
        languageCode
      );

      return {
        transcription: transcription,
        analysis: analysis,
        overallScore: this.calculateOverallScore(analysis),
        feedback: this.generateFeedback(analysis, targetText),
      };
    } catch (error) {
      this.logger.error(`Pronunciation analysis error: ${error.message}`);
      throw new Error('Failed to analyze pronunciation');
    }
  }

  async generateTargetAudio(
    text: string,
    languageCode: string = 'en-US',
    voiceName: string = 'en-US-Wavenet-D',
  ): Promise<Buffer> {
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          name: voiceName,
          ssmlGender: 'MALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      return response.audioContent as Buffer;
    } catch (error) {
      this.logger.error(`TTS generation error: ${error.message}`);
      throw new Error('Failed to generate target audio');
    }
  }

  private async transcribeAudio(
    audioBuffer: Buffer,
    languageCode: string,
  ): Promise<string> {
    const request = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: languageCode,
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioBuffer.toString('base64'),
      },
    };

    const [response] = await this.speechClient.recognize(request);
    return response.results[0]?.alternatives[0]?.transcript || '';
  }

  private async comparePronunciation(
    userTranscript: string,
    targetText: string,
    languageCode: string,
  ): Promise<any> {
    // Use Google's Speech-to-Text with word-level confidence
    const request = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: languageCode,
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        enableWordConfidence: true,
      },
      audio: {
        content: '', // This would be processed differently in a real implementation
      },
    };

    // For now, implement a basic comparison algorithm
    const userWords = userTranscript.toLowerCase().split(/\s+/);
    const targetWords = targetText.toLowerCase().split(/\s+/);

    const wordScores = [];
    let totalScore = 0;

    for (let i = 0; i < Math.max(userWords.length, targetWords.length); i++) {
      const userWord = userWords[i] || '';
      const targetWord = targetWords[i] || '';

      const score = this.calculateWordSimilarity(userWord, targetWord);
      wordScores.push({
        userWord,
        targetWord,
        score,
        isCorrect: score > 0.8,
      });

      totalScore += score;
    }

    return {
      wordScores,
      accuracy: totalScore / Math.max(userWords.length, targetWords.length),
      timing: this.analyzeTiming(userTranscript, targetText),
    };
  }

  private calculateWordSimilarity(userWord: string, targetWord: string): number {
    if (userWord === targetWord) return 1.0;
    if (!userWord || !targetWord) return 0.0;

    // Simple Levenshtein distance implementation
    const matrix = Array(userWord.length + 1)
      .fill(null)
      .map(() => Array(targetWord.length + 1).fill(null));

    for (let i = 0; i <= userWord.length; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= targetWord.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= userWord.length; i++) {
      for (let j = 1; j <= targetWord.length; j++) {
        const cost = userWord[i - 1] === targetWord[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    const distance = matrix[userWord.length][targetWord.length];
    return 1 - distance / Math.max(userWord.length, targetWord.length);
  }

  private analyzeTiming(userTranscript: string, targetText: string): any {
    const userWords = userTranscript.split(/\s+/).length;
    const targetWords = targetText.split(/\s+/).length;
    
    return {
      userWordCount: userWords,
      targetWordCount: targetWords,
      speedRatio: userWords / targetWords,
      timingAccuracy: Math.abs(1 - Math.abs(userWords - targetWords) / targetWords),
    };
  }

  private calculateOverallScore(analysis: any): number {
    const wordAccuracy = analysis.accuracy;
    const timingAccuracy = analysis.timing.timingAccuracy;
    
    return Math.round((wordAccuracy * 0.7 + timingAccuracy * 0.3) * 100);
  }

  private generateFeedback(analysis: any, targetText: string): string {
    const lowScoreWords = analysis.wordScores
      .filter((word: any) => word.score < 0.8)
      .map((word: any) => word.targetWord);

    if (lowScoreWords.length === 0) {
      return 'ممتاز! نطقك دقيق جداً. استمر على هذا النحو!';
    }

    const mistakes = lowScoreWords.slice(0, 3).join(', ');
    return `تحتاج إلى تحسين نطق الكلمات التالية: ${mistakes}. ركز على النطق الصحيح وحاول مرة أخرى.`;
  }
}