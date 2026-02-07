import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { GrammarRule } from '../../grammar/entities/grammar-rule.entity';

@Injectable()
export class LevelService {
  private readonly logger = new Logger(LevelService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
    @InjectRepository(Vocabulary)
    private vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(GrammarRule)
    private grammarRuleRepository: Repository<GrammarRule>,
  ) {}

  async calculateUserLevel(userId: string): Promise<any> {
    const userProgress = await this.getUserProgress(userId);
    const levelMetrics = await this.calculateLevelMetrics(userProgress);
    
    const currentLevel = this.determineCurrentLevel(levelMetrics);
    const nextLevel = this.getNextLevel(currentLevel);
    const progressToNextLevel = this.calculateProgressToNextLevel(levelMetrics, currentLevel);

    return {
      currentLevel,
      nextLevel,
      progressPercentage: progressToNextLevel,
      metrics: levelMetrics,
      recommendations: this.generateLevelRecommendations(levelMetrics, currentLevel),
    };
  }

  async updateLevelProgress(userId: string, activityType: string, score: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate new level based on activity
    const newLevelData = await this.calculateUserLevel(userId);
    
    if (newLevelData.currentLevel !== user.currentLevel) {
      user.currentLevel = newLevelData.currentLevel;
      user.level = this.getLevelNumber(newLevelData.currentLevel);
      
      await this.userRepository.save(user);
      
      this.logger.log(`User ${userId} advanced to level ${newLevelData.currentLevel}`);
    }
  }

  async getLevelMilestones(userId: string): Promise<any[]> {
    const userProgress = await this.getUserProgress(userId);
    const milestones = [];

    // Vocabulary milestones
    const vocabMilestones = await this.getVocabularyMilestones(userProgress);
    milestones.push(...vocabMilestones);

    // Grammar milestones
    const grammarMilestones = await this.getGrammarMilestones(userProgress);
    milestones.push(...grammarMilestones);

    // Time-based milestones
    const timeMilestones = await this.getTimeMilestones(userProgress);
    milestones.push(...timeMilestones);

    // Score-based milestones
    const scoreMilestones = await this.getScoreMilestones(userProgress);
    milestones.push(...scoreMilestones);

    return milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async getUserProgress(userId: string): Promise<any> {
    const progress = await this.userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ['vocabulary', 'grammarRule'],
      order: { createdAt: 'DESC' },
    });

    const vocabularyProgress = new Map<string, number[]>();
    const grammarProgress = new Map<string, number[]>();
    const levelProgress = new Map<string, { completed: number; total: number }>();

    progress.forEach(p => {
      if (p.vocabulary) {
        if (!vocabularyProgress.has(p.vocabulary.id)) {
          vocabularyProgress.set(p.vocabulary.id, []);
        }
        vocabularyProgress.get(p.vocabulary.id)!.push(p.score);
      }

      if (p.grammarRule) {
        if (!grammarProgress.has(p.grammarRule.id)) {
          grammarProgress.set(p.grammarRule.id, []);
        }
        grammarProgress.get(p.grammarRule.id)!.push(p.score);
      }

      if (p.lesson) {
        // This would need to be implemented based on your lesson structure
      }
    });

    return {
      vocabularyProgress,
      grammarProgress,
      totalActivities: progress.length,
      totalScore: progress.reduce((sum, p) => sum + p.score, 0),
      totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0),
      recentActivities: progress.slice(0, 20),
    };
  }

  private async calculateLevelMetrics(progress: any): Promise<any> {
    const vocabMastery = this.calculateVocabularyMastery(progress.vocabularyProgress);
    const grammarMastery = this.calculateGrammarMastery(progress.grammarProgress);
    
    const totalActivities = progress.totalActivities;
    const averageScore = totalActivities > 0 ? progress.totalScore / totalActivities : 0;
    const totalTimeSpent = progress.totalTimeSpent;

    return {
      vocabularyMastery,
      grammarMastery,
      totalActivities,
      averageScore,
      totalTimeSpent,
      activityFrequency: this.calculateActivityFrequency(progress.recentActivities),
      improvementRate: this.calculateImprovementRate(progress.recentActivities),
    };
  }

  private calculateVocabularyMastery(vocabProgress: Map<string, number[]>): any {
    let masteredCount = 0;
    let totalCount = 0;
    let averageMastery = 0;

    vocabProgress.forEach((scores, vocabId) => {
      totalCount++;
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore >= 80) {
        masteredCount++;
      }
      averageMastery += avgScore;
    });

    averageMastery = totalCount > 0 ? averageMastery / totalCount : 0;

    return {
      masteredCount,
      totalCount,
      masteryPercentage: totalCount > 0 ? (masteredCount / totalCount) * 100 : 0,
      averageMastery,
    };
  }

  private calculateGrammarMastery(grammarProgress: Map<string, number[]>): any {
    let masteredCount = 0;
    let totalCount = 0;
    let averageMastery = 0;

    grammarProgress.forEach((scores, grammarId) => {
      totalCount++;
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore >= 75) {
        masteredCount++;
      }
      averageMastery += avgScore;
    });

    averageMastery = totalCount > 0 ? averageMastery / totalCount : 0;

    return {
      masteredCount,
      totalCount,
      masteryPercentage: totalCount > 0 ? (masteredCount / totalCount) * 100 : 0,
      averageMastery,
    };
  }

  private calculateActivityFrequency(recentActivities: any[]): number {
    if (recentActivities.length < 2) return 0;

    const dates = recentActivities.map(a => new Date(a.createdAt).toDateString());
    const uniqueDates = new Set(dates);
    
    return uniqueDates.size / (recentActivities.length / 10); // Normalize to 10 activities
  }

  private calculateImprovementRate(recentActivities: any[]): number {
    if (recentActivities.length < 5) return 0;

    const recentScores = recentActivities.slice(0, 10).map(a => a.score);
    const olderScores = recentActivities.slice(10, 20).map(a => a.score);

    if (olderScores.length === 0) return 0;

    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    return recentAvg - olderAvg;
  }

  private determineCurrentLevel(metrics: any): string {
    const score = this.calculateLevelScore(metrics);
    
    if (score >= 90) return 'C2';
    if (score >= 80) return 'C1';
    if (score >= 70) return 'B2';
    if (score >= 60) return 'B1';
    if (score >= 50) return 'A2';
    return 'A1';
  }

  private calculateLevelScore(metrics: any): number {
    let score = 0;

    // Vocabulary weight: 40%
    score += metrics.vocabularyMastery.masteryPercentage * 0.4;

    // Grammar weight: 30%
    score += metrics.grammarMastery.masteryPercentage * 0.3;

    // Average score weight: 20%
    score += metrics.averageScore * 0.2;

    // Activity frequency weight: 10%
    score += metrics.activityFrequency * 10;

    // Improvement rate bonus
    if (metrics.improvementRate > 5) score += 5;
    else if (metrics.improvementRate < -5) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private getNextLevel(currentLevel: string): string {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
  }

  private calculateProgressToNextLevel(metrics: any, currentLevel: string): number {
    const currentScore = this.calculateLevelScore(metrics);
    const nextLevelThreshold = this.getLevelThreshold(this.getNextLevel(currentLevel));
    
    const currentLevelThreshold = this.getLevelThreshold(currentLevel);
    const levelRange = nextLevelThreshold - currentLevelThreshold;
    
    const progress = ((currentScore - currentLevelThreshold) / levelRange) * 100;
    
    return Math.max(0, Math.min(100, progress));
  }

  private getLevelThreshold(level: string): number {
    const thresholds = {
      'A1': 0,
      'A2': 50,
      'B1': 60,
      'B2': 70,
      'C1': 80,
      'C2': 90,
    };
    return thresholds[level] || 0;
  }

  private generateLevelRecommendations(metrics: any, currentLevel: string): string[] {
    const recommendations: string[] = [];

    if (metrics.vocabularyMastery.masteryPercentage < 70) {
      recommendations.push('ركز على تعلم المفردات الجديدة ومارسها بانتظام.');
    }

    if (metrics.grammarMastery.masteryPercentage < 60) {
      recommendations.push('راجع قواعد النحو الأساسية وحل التمارين بشكل منتظم.');
    }

    if (metrics.averageScore < 70) {
      recommendations.push('حاول فهم الأخطاء وتعلم من كل تجربة.');
    }

    if (metrics.activityFrequency < 0.5) {
      recommendations.push('زد من تكرار ممارستك للغة للحصول على تقدم أفضل.');
    }

    if (metrics.improvementRate < 0) {
      recommendations.push('راجع استراتيجيتك في التعلم وحاول تنويع الأنشطة.');
    }

    return recommendations;
  }

  private getLevelNumber(level: string): number {
    const levelMap = {
      'A1': 1,
      'A2': 2,
      'B1': 3,
      'B2': 4,
      'C1': 5,
      'C2': 6,
    };
    return levelMap[level] || 1;
  }

  private async getVocabularyMilestones(progress: any): Promise<any[]> {
    const milestones: any[] = [];
    
    // 100 words milestone
    if (progress.vocabularyProgress.size >= 100) {
      milestones.push({
        type: 'vocabulary',
        title: 'معلم 100 كلمة',
        description: 'لقد تعلمت 100 كلمة جديدة!',
        date: new Date(),
        icon: '📚',
      });
    }

    // 500 words milestone
    if (progress.vocabularyProgress.size >= 500) {
      milestones.push({
        type: 'vocabulary',
        title: 'معلم 500 كلمة',
        description: 'رحلة ممتازة! 500 كلمة جديدة.',
        date: new Date(),
        icon: '🏆',
      });
    }

    return milestones;
  }

  private async getGrammarMilestones(progress: any): Promise<any[]> {
    const milestones: any[] = [];
    
    // 10 grammar rules milestone
    if (progress.grammarProgress.size >= 10) {
      milestones.push({
        type: 'grammar',
        title: 'قواعد النحو 10',
        description: 'لقد أتقنت 10 قواعد نحوية!',
        date: new Date(),
        icon: '🔤',
      });
    }

    return milestones;
  }

  private async getTimeMilestones(progress: any): Promise<any[]> {
    const milestones: any[] = [];
    
    const totalTimeHours = progress.totalTimeSpent / 3600;
    
    if (totalTimeHours >= 10) {
      milestones.push({
        type: 'time',
        title: '10 ساعات تعلم',
        description: 'لقد قضيت 10 ساعات في تعلم اللغة!',
        date: new Date(),
        icon: '⏰',
      });
    }

    if (totalTimeHours >= 50) {
      milestones.push({
        type: 'time',
        title: '50 ساعة تعلم',
        description: 'معلم كبير! 50 ساعة من التعلم.',
        date: new Date(),
        icon: '🌟',
      });
    }

    return milestones;
  }

  private async getScoreMilestones(progress: any): Promise<any[]> {
    const milestones: any[] = [];
    
    if (progress.averageScore >= 90) {
      milestones.push({
        type: 'score',
        title: 'معدل 90%',
        description: 'أداء ممتاز! معدل تقدمك 90%.',
        date: new Date(),
        icon: '💯',
      });
    }

    return milestones;
  }
}