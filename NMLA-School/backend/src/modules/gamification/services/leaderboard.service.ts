import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
  ) {}

  async getGlobalLeaderboard(timeRange: string = 'week'): Promise<any[]> {
    const startDate = this.getStartDate(timeRange);
    
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'email', 'totalXp', 'level', 'currentLevel', 'profile'],
    });

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const xpGained = await this.getXpGainedInPeriod(user.id, startDate);
        const activitiesCompleted = await this.getActivitiesCompletedInPeriod(user.id, startDate);
        const achievementsUnlocked = await this.getAchievementsUnlockedInPeriod(user.id, startDate);

        return {
          userId: user.id,
          email: user.email,
          displayName: user.profile?.firstName || user.email,
          currentLevel: user.currentLevel,
          totalXp: user.totalXp,
          xpGained,
          activitiesCompleted,
          achievementsUnlocked,
          avatar: user.profile?.avatarUrl,
        };
      }),
    );

    return leaderboardData
      .sort((a, b) => b.xpGained - a.xpGained)
      .slice(0, 100);
  }

  async getUserRank(userId: string, timeRange: string = 'week'): Promise<number> {
    const leaderboard = await this.getGlobalLeaderboard(timeRange);
    const userRank = leaderboard.findIndex(user => user.userId === userId);
    return userRank === -1 ? 0 : userRank + 1;
  }

  async getLevelLeaderboard(level: string): Promise<any[]> {
    const users = await this.userRepository.find({
      where: { currentLevel: level, isActive: true },
      select: ['id', 'email', 'totalXp', 'level', 'profile'],
    });

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const xpGained = await this.getXpGainedInPeriod(user.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const activitiesCompleted = await this.getActivitiesCompletedInPeriod(user.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

        return {
          userId: user.id,
          displayName: user.profile?.firstName || user.email,
          totalXp: user.totalXp,
          xpGained,
          activitiesCompleted,
          avatar: user.profile?.avatarUrl,
        };
      }),
    );

    return leaderboardData
      .sort((a, b) => b.xpGained - a.xpGained)
      .slice(0, 50);
  }

  async getFriendsLeaderboard(userId: string, timeRange: string = 'week'): Promise<any[]> {
    // This would need to be implemented based on your friend system
    // For now, return a mock implementation
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Mock friends data - in a real implementation, this would come from a friends table
    const friends = await this.userRepository.find({
      where: { isActive: true },
      take: 10, // Mock: get first 10 users as friends
      select: ['id', 'email', 'totalXp', 'level', 'profile'],
    });

    const leaderboardData = await Promise.all(
      friends.map(async (friend) => {
        const xpGained = await this.getXpGainedInPeriod(friend.id, this.getStartDate(timeRange));
        const activitiesCompleted = await this.getActivitiesCompletedInPeriod(friend.id, this.getStartDate(timeRange));

        return {
          userId: friend.id,
          displayName: friend.profile?.firstName || friend.email,
          totalXp: friend.totalXp,
          xpGained,
          activitiesCompleted,
          avatar: friend.profile?.avatarUrl,
        };
      }),
    );

    return leaderboardData
      .sort((a, b) => b.xpGained - a.xpGained);
  }

  async getAchievementLeaderboard(timeRange: string = 'month'): Promise<any[]> {
    const startDate = this.getStartDate(timeRange);
    
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'email', 'profile'],
    });

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const achievements = await this.getAchievementsUnlockedInPeriod(user.id, startDate);
        const totalAchievements = await this.getTotalAchievements(user.id);

        return {
          userId: user.id,
          displayName: user.profile?.firstName || user.email,
          achievementsUnlocked: achievements,
          totalAchievements,
          avatar: user.profile?.avatarUrl,
        };
      }),
    );

    return leaderboardData
      .sort((a, b) => b.achievementsUnlocked - a.achievementsUnlocked)
      .slice(0, 50);
  }

  async getDailyChallengesLeaderboard(date: Date = new Date()): Promise<any[]> {
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'email', 'profile'],
    });

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const activitiesCompleted = await this.getActivitiesCompletedInPeriod(user.id, startDate, endDate);
        const xpGained = await this.getXpGainedInPeriod(user.id, startDate, endDate);

        return {
          userId: user.id,
          displayName: user.profile?.firstName || user.email,
          activitiesCompleted,
          xpGained,
          avatar: user.profile?.avatarUrl,
        };
      }),
    );

    return leaderboardData
      .sort((a, b) => b.activitiesCompleted - a.activitiesCompleted)
      .slice(0, 20);
  }

  private async getXpGainedInPeriod(userId: string, startDate: Date, endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    
    const progress = await this.userProgressRepository.find({
      where: {
        user: { id: userId },
        createdAt: { $gte: startDate, $lte: end },
      },
    });

    return progress.reduce((sum, p) => sum + p.score, 0);
  }

  private async getActivitiesCompletedInPeriod(userId: string, startDate: Date, endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    
    return this.userProgressRepository.count({
      where: {
        user: { id: userId },
        isCompleted: true,
        createdAt: { $gte: startDate, $lte: end },
      },
    });
  }

  private async getAchievementsUnlockedInPeriod(userId: string, startDate: Date, endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    
    return this.userAchievementRepository.count({
      where: {
        user: { id: userId },
        isUnlocked: true,
        unlockedAt: { $gte: startDate, $lte: end },
      },
    });
  }

  private async getTotalAchievements(userId: string): Promise<number> {
    return this.userAchievementRepository.count({
      where: {
        user: { id: userId },
        isUnlocked: true,
      },
    });
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    
    switch (timeRange) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
}