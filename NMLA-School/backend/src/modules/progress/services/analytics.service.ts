import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { UserAnalytics } from '../entities/user-analytics.entity';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Sentence } from '../../vocabulary/entities/sentence.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
    @InjectRepository(UserAnalytics)
    private userAnalyticsRepository: Repository<UserAnalytics>,
    @InjectRepository(Vocabulary)
    private vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
  ) {}

  async generateUserAnalytics(userId: string): Promise<UserAnalytics> {
    const userProgress = await this.userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ['vocabulary', 'sentence'],
      order: { createdAt: 'DESC' },
    });

    const metrics = this.calculateMetrics(userProgress);
    const insights = this.generateInsights(userProgress, metrics);
    const recommendations = await this.generateRecommendations(userId, metrics);

    const analytics = this.userAnalyticsRepository.create({
      user: { id: userId } as User,
      sessionId: this.generateSessionId(),
      metrics,
      insights,
      recommendations,
    });

    return this.userAnalyticsRepository.save(analytics);
  }

  async getUserProgressReport(userId: string, timeRange: string = 'week'): Promise<any> {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    const progressData = await this.userProgressRepository.find({
      where: {
        user: { id: userId },
        createdAt: { $gte: startDate, $lte: endDate },
      },
      relations: ['vocabulary', 'sentence'],
    });

    return this.formatProgressReport(progressData, timeRange);
  }

  async getLearningPatterns(userId: string): Promise<any> {
    const progressData = await this.userProgressRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });

    return this.analyzeLearningPatterns(progressData);
  }

  private calculateMetrics(progressData: UserProgress[]): any {
    const totalActivities = progressData.length;
    const completedActivities = progressData.filter(p => p.isCompleted).length;
    const averageScore = progressData.reduce((sum, p) => sum + p.score, 0) / totalActivities || 0;
    
    const vocabularyProgress = progressData.filter(p => p.vocabulary);
    const grammarProgress = progressData.filter(p => p.grammarRule);
    const lessonProgress = progressData.filter(p => p.lesson);

    const timeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);

    return {
      totalActivities,
      completedActivities,
      completionRate: (completedActivities / totalActivities) * 100,
      averageScore,
      timeSpent,
      vocabularyActivities: vocabularyProgress.length,
      grammarActivities: grammarProgress.length,
      lessonActivities: lessonProgress.length,
      lastActivity: progressData[0]?.createdAt,
    };
  }

  private generateInsights(progressData: UserProgress[], metrics: any): any {
    const insights = [];

    // Performance insights
    if (metrics.averageScore < 70) {
      insights.push({
        type: 'performance',
        message: 'تحتاج إلى تحسين أدائك في التمارين. حاول مراجعة الدروس السابقة.',
        priority: 'high',
      });
    }

    if (metrics.completionRate < 80) {
      insights.push({
        type: 'completion',
        message: 'نسبة إكمال التمارين منخفضة. حاول إكمال جميع التمارين للحصول على أفضل تقدم.',
        priority: 'medium',
      });
    }

    // Learning pattern insights
    const recentProgress = progressData.slice(0, 10);
    const recentScores = recentProgress.map(p => p.score);
    const scoreTrend = this.calculateTrend(recentScores);

    if (scoreTrend < -0.1) {
      insights.push({
        type: 'trend',
        message: 'هناك انخفاض في مستويات أدائك近期. قد تحتاج إلى تغيير استراتيجية التعلم.',
        priority: 'high',
      });
    }

    // Vocabulary insights
    const vocabularyScores = progressData
      .filter(p => p.vocabulary)
      .map(p => p.score);
    
    if (vocabularyScores.length > 0) {
      const avgVocabScore = vocabularyScores.reduce((sum, score) => sum + score, 0) / vocabularyScores.length;
      if (avgVocabScore < 75) {
        insights.push({
          type: 'vocabulary',
          message: 'مهاراتك في المفردات تحتاج إلى تحسين. ركز على ممارسة المفردات الجديدة.',
          priority: 'medium',
        });
      }
    }

    return insights;
  }

  private async generateRecommendations(userId: string, metrics: any): Promise<any[]> {
    const recommendations = [];

    // Based on performance
    if (metrics.averageScore < 70) {
      recommendations.push({
        type: 'review',
        title: 'مراجعة الدروس السابقة',
        description: 'نوصي بمراجعة الدروس السابقة لتحسين الفهم.',
        priority: 'high',
      });
    }

    // Based on completion rate
    if (metrics.completionRate < 80) {
      recommendations.push({
        type: 'complete',
        title: 'إكمال التمارين المعلقة',
        description: 'أكمل التمارين التي لم تنتهِ منها لتحسين تقدمك.',
        priority: 'medium',
      });
    }

    // Based on vocabulary performance
    const weakVocabulary = await this.getWeakVocabulary(userId);
    if (weakVocabulary.length > 0) {
      recommendations.push({
        type: 'vocabulary',
        title: 'ممارسة المفردات الضعيفة',
        description: `ركز على هذه الكلمات: ${weakVocabulary.slice(0, 3).join(', ')}`,
        priority: 'medium',
      });
    }

    return recommendations;
  }

  private async getWeakVocabulary(userId: string): Promise<string[]> {
    const progressData = await this.userProgressRepository.find({
      where: { user: { id: userId }, vocabulary: { id: { $ne: null } } },
      relations: ['vocabulary'],
      order: { createdAt: 'DESC' },
    });

    const vocabularyScores = new Map<string, number[]>();
    
    progressData.forEach(progress => {
      if (progress.vocabulary && progress.score < 80) {
        if (!vocabularyScores.has(progress.vocabulary.word)) {
          vocabularyScores.set(progress.vocabulary.word, []);
        }
        vocabularyScores.get(progress.vocabulary.word)!.push(progress.score);
      }
    });

    const weakVocabulary: string[] = [];
    vocabularyScores.forEach((scores, word) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore < 70) {
        weakVocabulary.push(word);
      }
    });

    return weakVocabulary.slice(0, 10);
  }

  private analyzeLearningPatterns(progressData: UserProgress[]): any {
    const dailyActivity = new Map<string, number>();
    const hourlyActivity = new Map<number, number>();

    progressData.forEach(progress => {
      const date = progress.createdAt.toISOString().split('T')[0];
      const hour = progress.createdAt.getHours();

      dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });

    const mostActiveDay = Array.from(dailyActivity.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const mostActiveHour = Array.from(hourlyActivity.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      mostActiveDay,
      mostActiveHour,
      totalDaysActive: dailyActivity.size,
      averageDailySessions: progressData.length / dailyActivity.size,
      peakHours: Array.from(hourlyActivity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({ hour, sessions: count })),
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private formatProgressReport(progressData: UserProgress[], timeRange: string): any {
    return {
      timeRange,
      totalActivities: progressData.length,
      totalScore: progressData.reduce((sum, p) => sum + p.score, 0),
      totalTimeSpent: progressData.reduce((sum, p) => sum + p.timeSpent, 0),
      activitiesByType: this.groupActivitiesByType(progressData),
      dailyBreakdown: this.getDailyBreakdown(progressData),
    };
  }

  private groupActivitiesByType(progressData: UserProgress[]): any {
    const types = ['vocabulary', 'grammar', 'lesson', 'exercise'];
    const result: any = {};

    types.forEach(type => {
      result[type] = progressData.filter(p => p[type]).length;
    });

    return result;
  }

  private getDailyBreakdown(progressData: UserProgress[]): any[] {
    const dailyData = new Map<string, any>();

    progressData.forEach(progress => {
      const date = progress.createdAt.toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          activities: 0,
          totalScore: 0,
          totalTime: 0,
        });
      }

      const dayData = dailyData.get(date);
      dayData.activities++;
      dayData.totalScore += progress.score;
      dayData.totalTime += progress.timeSpent;
    });

    return Array.from(dailyData.values());
  }

  private getStartDate(timeRange: string, endDate: Date): Date {
    const start = new Date(endDate);
    
    switch (timeRange) {
      case 'day':
        start.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        start.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        start.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        start.setDate(endDate.getDate() - 7);
    }

    return start;
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}