import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Sentence } from '../../vocabulary/entities/sentence.entity';
import { GrammarRule } from '../../grammar/entities/grammar-rule.entity';
import { ContentRecommendation } from '../entities/content-recommendation.entity';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
    @InjectRepository(Vocabulary)
    private vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
    @InjectRepository(GrammarRule)
    private grammarRuleRepository: Repository<GrammarRule>,
    @InjectRepository(ContentRecommendation)
    private contentRecommendationRepository: Repository<ContentRecommendation>,
  ) {}

  async generatePersonalizedRecommendations(userId: string): Promise<ContentRecommendation[]> {
    const userProgress = await this.getUserProgress(userId);
    const userLevel = await this.getUserLevel(userId);
    
    const recommendations: ContentRecommendation[] = [];

    // Generate vocabulary recommendations
    const vocabRecommendations = await this.generateVocabularyRecommendations(userId, userProgress, userLevel);
    recommendations.push(...vocabRecommendations);

    // Generate grammar recommendations
    const grammarRecommendations = await this.generateGrammarRecommendations(userId, userProgress, userLevel);
    recommendations.push(...grammarRecommendations);

    // Generate lesson recommendations
    const lessonRecommendations = await this.generateLessonRecommendations(userId, userProgress, userLevel);
    recommendations.push(...lessonRecommendations);

    // Generate practice recommendations
    const practiceRecommendations = await this.generatePracticeRecommendations(userId, userProgress, userLevel);
    recommendations.push(...practiceRecommendations);

    // Save recommendations to database
    await this.contentRecommendationRepository.save(recommendations);

    return recommendations;
  }

  async getUserRecommendations(userId: string): Promise<ContentRecommendation[]> {
    return this.contentRecommendationRepository.find({
      where: { user: { id: userId }, isConsumed: false },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  private async getUserProgress(userId: string): Promise<any> {
    const progress = await this.userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ['vocabulary', 'grammarRule', 'sentence'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const vocabularyScores = new Map<string, number[]>();
    const grammarScores = new Map<string, number[]>();
    const sentenceScores = new Map<string, number[]>();

    progress.forEach(p => {
      if (p.vocabulary) {
        if (!vocabularyScores.has(p.vocabulary.id)) {
          vocabularyScores.set(p.vocabulary.id, []);
        }
        vocabularyScores.get(p.vocabulary.id)!.push(p.score);
      }

      if (p.grammarRule) {
        if (!grammarScores.has(p.grammarRule.id)) {
          grammarScores.set(p.grammarRule.id, []);
        }
        grammarScores.get(p.grammarRule.id)!.push(p.score);
      }

      if (p.sentence) {
        if (!sentenceScores.has(p.sentence.id)) {
          sentenceScores.set(p.sentence.id, []);
        }
        sentenceScores.get(p.sentence.id)!.push(p.score);
      }
    });

    return {
      vocabularyScores,
      grammarScores,
      sentenceScores,
      totalActivities: progress.length,
      recentActivities: progress.slice(0, 10),
    };
  }

  private async getUserLevel(userId: string): Promise<string> {
    const user = await this.userProgressRepository.manager
      .createQueryBuilder(User, 'user')
      .where('user.id = :userId', { userId })
      .getOne();

    return user?.currentLevel || 'A1';
  }

  private async generateVocabularyRecommendations(
    userId: string,
    userProgress: any,
    userLevel: string,
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Find weak vocabulary
    const weakVocabulary = Array.from(userProgress.vocabularyScores.entries())
      .filter(([_, scores]) => {
        const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
        return avgScore < 75;
      })
      .map(([vocabId, _]) => vocabId);

    if (weakVocabulary.length > 0) {
      const vocabData = await this.vocabularyRepository.findByIds(weakVocabulary.slice(0, 3));
      
      vocabData.forEach(vocab => {
        recommendations.push(this.contentRecommendationRepository.create({
          user: { id: userId } as User,
          sessionId: this.generateSessionId(),
          recommendationType: 'vocabulary_practice',
          content: {
            type: 'vocabulary',
            id: vocab.id,
            word: vocab.word,
            arabicMeaning: vocab.arabicMeaning,
            level: vocab.cefrLevel,
          },
          confidenceScore: 0.8,
          isActive: true,
        }));
      });
    }

    // Find new vocabulary at user level
    const newVocabulary = await this.vocabularyRepository.find({
      where: {
        cefrLevel: userLevel,
        isActive: true,
      },
      order: { usageCount: 'ASC' },
      take: 5,
    });

    newVocabulary.forEach(vocab => {
      if (!weakVocabulary.includes(vocab.id)) {
        recommendations.push(this.contentRecommendationRepository.create({
          user: { id: userId } as User,
          sessionId: this.generateSessionId(),
          recommendationType: 'vocabulary_learn',
          content: {
            type: 'vocabulary',
            id: vocab.id,
            word: vocab.word,
            arabicMeaning: vocab.arabicMeaning,
            level: vocab.cefrLevel,
          },
          confidenceScore: 0.6,
          isActive: true,
        }));
      }
    });

    return recommendations;
  }

  private async generateGrammarRecommendations(
    userId: string,
    userProgress: any,
    userLevel: string,
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Find weak grammar rules
    const weakGrammar = Array.from(userProgress.grammarScores.entries())
      .filter(([_, scores]) => {
        const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
        return avgScore < 70;
      })
      .map(([grammarId, _]) => grammarId);

    if (weakGrammar.length > 0) {
      const grammarData = await this.grammarRuleRepository.findByIds(weakGrammar.slice(0, 2));
      
      grammarData.forEach(grammar => {
        recommendations.push(this.contentRecommendationRepository.create({
          user: { id: userId } as User,
          sessionId: this.generateSessionId(),
          recommendationType: 'grammar_review',
          content: {
            type: 'grammar',
            id: grammar.id,
            title: grammar.title,
            category: grammar.category,
            level: grammar.level,
          },
          confidenceScore: 0.9,
          isActive: true,
        }));
      });
    }

    // Find new grammar rules at user level
    const newGrammar = await this.grammarRuleRepository.find({
      where: {
        level: userLevel,
        isActive: true,
      },
      order: { order: 'ASC' },
      take: 3,
    });

    newGrammar.forEach(grammar => {
      if (!weakGrammar.includes(grammar.id)) {
        recommendations.push(this.contentRecommendationRepository.create({
          user: { id: userId } as User,
          sessionId: this.generateSessionId(),
          recommendationType: 'grammar_learn',
          content: {
            type: 'grammar',
            id: grammar.id,
            title: grammar.title,
            category: grammar.category,
            level: grammar.level,
          },
          confidenceScore: 0.7,
          isActive: true,
        }));
      }
    });

    return recommendations;
  }

  private async generateLessonRecommendations(
    userId: string,
    userProgress: any,
    userLevel: string,
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Find incomplete lessons
    const incompleteLessons = userProgress.recentActivities
      .filter((p: any) => p.lesson && !p.isCompleted)
      .map((p: any) => p.lesson.id);

    if (incompleteLessons.length > 0) {
      recommendations.push(this.contentRecommendationRepository.create({
        user: { id: userId } as User,
        sessionId: this.generateSessionId(),
        recommendationType: 'lesson_complete',
        content: {
          type: 'lesson',
          action: 'complete_incomplete',
          lessonIds: incompleteLessons,
        },
        confidenceScore: 0.8,
        isActive: true,
      }));
    }

    // Find next lessons in sequence
    const nextLessons = await this.getSequentialLessons(userLevel);
    if (nextLessons.length > 0) {
      recommendations.push(this.contentRecommendationRepository.create({
        user: { id: userId } as User,
        sessionId: this.generateSessionId(),
        recommendationType: 'lesson_next',
        content: {
          type: 'lesson',
          action: 'start_next',
          lessons: nextLessons.map(l => ({ id: l.id, title: l.title, level: l.level })),
        },
        confidenceScore: 0.7,
        isActive: true,
      }));
    }

    return recommendations;
  }

  private async generatePracticeRecommendations(
    userId: string,
    userProgress: any,
    userLevel: string,
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Based on weak areas
    const weakAreas = [];
    
    if (userProgress.vocabularyScores.size > 0) {
      const vocabAvg = Array.from(userProgress.vocabularyScores.values())
        .map(scores => scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
        .reduce((sum: number, avg: number) => sum + avg, 0) / userProgress.vocabularyScores.size;

      if (vocabAvg < 75) {
        weakAreas.push('vocabulary');
      }
    }

    if (userProgress.grammarScores.size > 0) {
      const grammarAvg = Array.from(userProgress.grammarScores.values())
        .map(scores => scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
        .reduce((sum: number, avg: number) => sum + avg, 0) / userProgress.grammarScores.size;

      if (grammarAvg < 70) {
        weakAreas.push('grammar');
      }
    }

    if (weakAreas.length > 0) {
      recommendations.push(this.contentRecommendationRepository.create({
        user: { id: userId } as User,
        sessionId: this.generateSessionId(),
        recommendationType: 'practice_targeted',
        content: {
          type: 'practice',
          focusAreas: weakAreas,
          difficulty: userLevel,
          exerciseCount: 5,
        },
        confidenceScore: 0.8,
        isActive: true,
      }));
    }

    return recommendations;
  }

  private async getSequentialLessons(userLevel: string): Promise<any[]> {
    // This would need to be implemented based on your lesson sequencing logic
    // For now, return a placeholder
    return [];
  }

  private generateSessionId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}