import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { Achievement } from '../entities/achievement.entity';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
  ) {}

  async grantAchievementRewards(userId: string, achievementId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const achievement = await this.achievementRepository.findOne({ where: { id: achievementId } });

    if (!user || !achievement) {
      throw new Error('User or achievement not found');
    }

    // Grant XP reward
    user.totalXp += achievement.xpReward;
    user.level = this.calculateUserLevel(user.totalXp);

    // Grant coin reward (if implemented)
    // user.coins += achievement.coinReward;

    await this.userRepository.save(user);

    // Log the reward grant
    this.logger.log(`Granted rewards for achievement ${achievement.title} to user ${user.email}`);
  }

  async grantDailyLoginReward(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Daily login reward logic
    const dailyReward = this.calculateDailyReward(user.loginStreak);
    user.totalXp += dailyReward.xp;
    user.loginStreak += 1;

    await this.userRepository.save(user);

    this.logger.log(`Granted daily login reward to user ${user.email}. Streak: ${user.loginStreak}`);
  }

  async grantActivityReward(userId: string, activityType: string, score: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate activity reward based on type and score
    const reward = this.calculateActivityReward(activityType, score);
    user.totalXp += reward.xp;

    await this.userRepository.save(user);

    this.logger.log(`Granted activity reward to user ${user.email}. Type: ${activityType}, Score: ${score}`);
  }

  async grantLevelUpReward(userId: string, newLevel: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Level up reward logic
    const levelReward = this.getLevelUpReward(newLevel);
    user.totalXp += levelReward.xp;

    await this.userRepository.save(user);

    this.logger.log(`Granted level up reward to user ${user.email}. New level: ${newLevel}`);
  }

  async checkAndGrantMilestoneRewards(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const milestones = this.getMilestoneRewards(user);
    
    for (const milestone of milestones) {
      if (this.shouldGrantMilestone(user, milestone)) {
        user.totalXp += milestone.reward.xp;
        
        // Grant milestone achievement
        await this.grantMilestoneAchievement(user.id, milestone.id);
        
        this.logger.log(`Granted milestone reward to user ${user.email}: ${milestone.name}`);
      }
    }

    await this.userRepository.save(user);
  }

  private calculateDailyReward(loginStreak: number): any {
    if (loginStreak >= 7) return { xp: 50, coins: 10 };
    if (loginStreak >= 3) return { xp: 30, coins: 5 };
    return { xp: 10, coins: 2 };
  }

  private calculateActivityReward(activityType: string, score: number): any {
    const baseRewards = {
      vocabulary: { xp: 10 },
      grammar: { xp: 15 },
      lesson: { xp: 20 },
      exercise: { xp: 12 },
      pronunciation: { xp: 18 },
    };

    const baseReward = baseRewards[activityType] || { xp: 10 };
    const scoreMultiplier = score >= 90 ? 1.5 : score >= 70 ? 1.2 : 1.0;

    return {
      xp: Math.round(baseReward.xp * scoreMultiplier),
    };
  }

  private getLevelUpReward(level: string): any {
    const levelRewards = {
      'A2': { xp: 100 },
      'B1': { xp: 200 },
      'B2': { xp: 300 },
      'C1': { xp: 500 },
      'C2': { xp: 1000 },
    };

    return levelRewards[level] || { xp: 50 };
  }

  private getMilestoneRewards(user: User): any[] {
    return [
      {
        id: '100_words',
        name: '100 Words Mastered',
        condition: user.totalXp >= 1000,
        reward: { xp: 200 },
      },
      {
        id: 'first_week',
        name: 'First Week Complete',
        condition: user.loginStreak >= 7,
        reward: { xp: 150 },
      },
      {
        id: 'grammar_master',
        name: 'Grammar Master',
        condition: user.totalXp >= 2000,
        reward: { xp: 300 },
      },
      {
        id: 'pronunciation_pro',
        name: 'Pronunciation Pro',
        condition: user.totalXp >= 1500,
        reward: { xp: 250 },
      },
    ];
  }

  private shouldGrantMilestone(user: User, milestone: any): boolean {
    // Check if milestone was already granted
    // This would need to be implemented based on your milestone tracking system
    return milestone.condition;
  }

  private async grantMilestoneAchievement(userId: string, milestoneId: string): Promise<void> {
    // Create milestone achievement
    const milestoneAchievement = this.userAchievementRepository.create({
      user: { id: userId } as User,
      achievement: null, // Would need to create milestone achievement in database
      isUnlocked: true,
      unlockedAt: new Date(),
    });

    await this.userAchievementRepository.save(milestoneAchievement);
  }

  private calculateUserLevel(totalXp: number): number {
    // Simple level calculation: level = floor(sqrt(totalXp / 100)) + 1
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }
}