import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
  ) {}

  async checkAchievements(user: User): Promise<UserAchievement[]> {
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    const unlockedAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      const isUnlocked = await this.checkAchievementRequirements(
        user,
        achievement,
      );

      if (isUnlocked) {
        const existingAchievement = await this.userAchievementRepository.findOne({
          where: {
            user: { id: user.id },
            achievement: { id: achievement.id },
          },
        });

        if (!existingAchievement) {
          const userAchievement = this.userAchievementRepository.create({
            user,
            achievement,
            isUnlocked: true,
            unlockedAt: new Date(),
          });

          await this.userAchievementRepository.save(userAchievement);
          unlockedAchievements.push(userAchievement);

          // Grant rewards
          await this.grantAchievementRewards(user, achievement);
        }
      }
    }

    return unlockedAchievements;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementRepository.find({
      where: { user: { id: userId } },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  private async checkAchievementRequirements(
    user: User,
    achievement: Achievement,
  ): Promise<boolean> {
    const requirements = achievement.requirements;

    switch (achievement.category) {
      case 'login_streak':
        return this.checkLoginStreak(user, requirements);
      case 'xp_milestones':
        return this.checkXpMilestones(user, requirements);
      case 'vocabulary_mastery':
        return this.checkVocabularyMastery(user, requirements);
      case 'grammar_completion':
        return this.checkGrammarCompletion(user, requirements);
      case 'pronunciation_practice':
        return this.checkPronunciationPractice(user, requirements);
      case 'lesson_completion':
        return this.checkLessonCompletion(user, requirements);
      case 'daily_goals':
        return this.checkDailyGoals(user, requirements);
      default:
        return false;
    }
  }

  private async checkLoginStreak(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    return user.loginStreak >= requirements.minStreak;
  }

  private async checkXpMilestones(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    return user.totalXp >= requirements.minXp;
  }

  private async checkVocabularyMastery(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    const masteredVocabulary = await this.userProgressRepository.count({
      where: {
        user: { id: user.id },
        vocabulary: { difficultyLevel: In(requirements.levels) },
        score: requirements.minScore,
      },
    });

    return masteredVocabulary >= requirements.minCount;
  }

  private async checkGrammarCompletion(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    const completedGrammar = await this.userProgressRepository.count({
      where: {
        user: { id: user.id },
        grammarRule: { level: In(requirements.levels) },
        isCompleted: true,
      },
    });

    return completedGrammar >= requirements.minCount;
  }

  private async checkPronunciationPractice(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    // This would need to be implemented based on your pronunciation tracking
    return false;
  }

  private async checkLessonCompletion(
    user: User,
    requirements: any,
  ): Promise<boolean> {
    const completedLessons = await this.userProgressRepository.count({
      where: {
        user: { id: user.id },
        lesson: { level: In(requirements.levels) },
        isCompleted: true,
      },
    });

    return completedLessons >= requirements.minCount;
  }

  private async checkDailyGoals(user: User, requirements: any): Promise<boolean> {
    // Check if user completed daily goals for required days
    const today = new Date();
    const startDate = new Date(today.getTime() - requirements.days * 24 * 60 * 60 * 1000);

    const dailyProgress = await this.userProgressRepository.count({
      where: {
        user: { id: user.id },
        createdAt: { $gte: startDate },
      },
      distinct: ['DATE(createdAt)'],
    });

    return dailyProgress >= requirements.minDays;
  }

  private async grantAchievementRewards(
    user: User,
    achievement: Achievement,
  ): Promise<void> {
    // Update user XP
    user.totalXp += achievement.xpReward;
    user.level = this.calculateUserLevel(user.totalXp);

    await this.userAchievementRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(User, user);

        // Log achievement unlock
        this.logger.log(
          `User ${user.id} unlocked achievement: ${achievement.title}`,
        );
      },
    );
  }

  private calculateUserLevel(totalXp: number): number {
    // Simple level calculation: level = floor(sqrt(totalXp / 100)) + 1
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }
}