import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AchievementService } from './services/achievement.service';
import { LeaderboardService } from './services/leaderboard.service';
import { RewardService } from './services/reward.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(
    private achievementService: AchievementService,
    private leaderboardService: LeaderboardService,
    private rewardService: RewardService,
  ) {}

  @Get('achievements')
  @ApiOperation({ summary: 'Get available achievements' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully' })
  async getAvailableAchievements(): Promise<Achievement[]> {
    return this.achievementService.getAvailableAchievements();
  }

  @Get('achievements/user')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'User achievements retrieved successfully' })
  async getUserAchievements(@CurrentUser() user: User): Promise<UserAchievement[]> {
    return this.achievementService.getUserAchievements(user.id);
  }

  @Post('achievements/check')
  @ApiOperation({ summary: 'Check for new achievements' })
  @ApiResponse({ status: 200, description: 'Achievement check completed successfully' })
  async checkAchievements(@CurrentUser() user: User): Promise<UserAchievement[]> {
    return this.achievementService.checkAchievements(user);
  }

  @Get('leaderboard/global')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiResponse({ status: 200, description: 'Global leaderboard retrieved successfully' })
  async getGlobalLeaderboard(
    @Body() body: {
      timeRange?: string;
    },
  ) {
    const leaderboard = await this.leaderboardService.getGlobalLeaderboard(
      body.timeRange || 'week',
    );

    return {
      success: true,
      leaderboard,
      timeRange: body.timeRange || 'week',
      count: leaderboard.length,
    };
  }

  @Get('leaderboard/level/:level')
  @ApiOperation({ summary: 'Get level-specific leaderboard' })
  @ApiResponse({ status: 200, description: 'Level leaderboard retrieved successfully' })
  async getLevelLeaderboard(@Param('level') level: string) {
    const leaderboard = await this.leaderboardService.getLevelLeaderboard(level);

    return {
      success: true,
      leaderboard,
      level,
      count: leaderboard.length,
    };
  }

  @Get('leaderboard/friends')
  @ApiOperation({ summary: 'Get friends leaderboard' })
  @ApiResponse({ status: 200, description: 'Friends leaderboard retrieved successfully' })
  async getFriendsLeaderboard(
    @CurrentUser() user: User,
    @Body() body: {
      timeRange?: string;
    },
  ) {
    const leaderboard = await this.leaderboardService.getFriendsLeaderboard(
      user.id,
      body.timeRange || 'week',
    );

    return {
      success: true,
      leaderboard,
      timeRange: body.timeRange || 'week',
      count: leaderboard.length,
    };
  }

  @Get('leaderboard/achievements')
  @ApiOperation({ summary: 'Get achievement leaderboard' })
  @ApiResponse({ status: 200, description: 'Achievement leaderboard retrieved successfully' })
  async getAchievementLeaderboard(
    @Body() body: {
      timeRange?: string;
    },
  ) {
    const leaderboard = await this.leaderboardService.getAchievementLeaderboard(
      body.timeRange || 'month',
    );

    return {
      success: true,
      leaderboard,
      timeRange: body.timeRange || 'month',
      count: leaderboard.length,
    };
  }

  @Get('leaderboard/daily/:date')
  @ApiOperation({ summary: 'Get daily challenges leaderboard' })
  @ApiResponse({ status: 200, description: 'Daily leaderboard retrieved successfully' })
  async getDailyLeaderboard(
    @Param('date') date: string,
    @Body() body: {
      timeRange?: string;
    },
  ) {
    const leaderboard = await this.leaderboardService.getDailyChallengesLeaderboard(
      new Date(date),
    );

    return {
      success: true,
      leaderboard,
      date,
      count: leaderboard.length,
    };
  }

  @Get('user/rank')
  @ApiOperation({ summary: 'Get user rank' })
  @ApiResponse({ status: 200, description: 'User rank retrieved successfully' })
  async getUserRank(
    @CurrentUser() user: User,
    @Body() body: {
      timeRange?: string;
    },
  ) {
    const rank = await this.leaderboardService.getUserRank(
      user.id,
      body.timeRange || 'week',
    );

    return {
      success: true,
      rank,
      timeRange: body.timeRange || 'week',
    };
  }

  @Post('rewards/daily-login')
  @ApiOperation({ summary: 'Grant daily login reward' })
  @ApiResponse({ status: 200, description: 'Daily login reward granted successfully' })
  async grantDailyLoginReward(@CurrentUser() user: User) {
    await this.rewardService.grantDailyLoginReward(user.id);

    return {
      success: true,
      message: 'Daily login reward granted',
    };
  }

  @Post('rewards/activity')
  @ApiOperation({ summary: 'Grant activity reward' })
  @ApiResponse({ status: 200, description: 'Activity reward granted successfully' })
  async grantActivityReward(
    @CurrentUser() user: User,
    @Body() body: {
      activityType: string;
      score: number;
    },
  ) {
    await this.rewardService.grantActivityReward(
      user.id,
      body.activityType,
      body.score,
    );

    return {
      success: true,
      message: 'Activity reward granted',
      activityType: body.activityType,
      score: body.score,
    };
  }

  @Post('rewards/level-up')
  @ApiOperation({ summary: 'Grant level up reward' })
  @ApiResponse({ status: 200, description: 'Level up reward granted successfully' })
  async grantLevelUpReward(
    @CurrentUser() user: User,
    @Body() body: {
      newLevel: string;
    },
  ) {
    await this.rewardService.grantLevelUpReward(user.id, body.newLevel);

    return {
      success: true,
      message: 'Level up reward granted',
      newLevel: body.newLevel,
    };
  }

  @Post('rewards/milestones')
  @ApiOperation({ summary: 'Check and grant milestone rewards' })
  @ApiResponse({ status: 200, description: 'Milestone rewards checked and granted successfully' })
  async checkAndGrantMilestoneRewards(@CurrentUser() user: User) {
    await this.rewardService.checkAndGrantMilestoneRewards(user.id);

    return {
      success: true,
      message: 'Milestone rewards checked and granted',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user gamification statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@CurrentUser() user: User) {
    const achievements = await this.achievementService.getUserAchievements(user.id);
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    const totalXp = user.totalXp;
    const level = user.level;
    const loginStreak = user.loginStreak;

    return {
      success: true,
      stats: {
        totalXp,
        level,
        loginStreak,
        totalAchievements: achievements.length,
        unlockedAchievements: unlockedAchievements.length,
        achievementPercentage: achievements.length > 0 
          ? Math.round((unlockedAchievements.length / achievements.length) * 100) 
          : 0,
      },
    };
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user progress in gamification' })
  @ApiResponse({ status: 200, description: 'User progress retrieved successfully' })
  async getUserProgress(@CurrentUser() user: User) {
    const achievements = await this.achievementService.getUserAchievements(user.id);
    const availableAchievements = await this.achievementService.getAvailableAchievements();

    // Calculate progress towards next level
    const nextLevelXp = this.getNextLevelXp(user.level + 1);
    const progressToNextLevel = user.totalXp / nextLevelXp * 100;

    // Calculate achievement progress
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalAchievements = availableAchievements.length;
    const achievementProgress = totalAchievements > 0 
      ? (unlockedCount / totalAchievements) * 100 
      : 0;

    return {
      success: true,
      progress: {
        xpProgress: progressToNextLevel,
        achievementProgress,
        currentLevel: user.level,
        nextLevel: user.level + 1,
        currentXp: user.totalXp,
        nextLevelXp,
        unlockedAchievements: unlockedCount,
        totalAchievements,
      },
    };
  }

  @Post('challenge/start/:challengeType')
  @ApiOperation({ summary: 'Start a gamification challenge' })
  @ApiResponse({ status: 200, description: 'Challenge started successfully' })
  async startChallenge(
    @CurrentUser() user: User,
    @Param('challengeType') challengeType: string,
    @Body() body: {
      difficulty?: string;
      duration?: number;
    },
  ) {
    // This would implement starting a specific challenge
    // For now, return a mock response
    return {
      success: true,
      challenge: {
        id: `challenge_${Date.now()}`,
        type: challengeType,
        difficulty: body.difficulty || 'medium',
        duration: body.duration || 3600, // 1 hour default
        startTime: new Date().toISOString(),
        target: this.getChallengeTarget(challengeType, body.difficulty),
      },
      message: 'Challenge started successfully',
    };
  }

  @Post('challenge/complete/:challengeId')
  @ApiOperation({ summary: 'Complete a gamification challenge' })
  @ApiResponse({ status: 200, description: 'Challenge completed successfully' })
  async completeChallenge(
    @CurrentUser() user: User,
    @Param('challengeId') challengeId: string,
  ) {
    // This would implement challenge completion logic
    // For now, return a mock response
    return {
      success: true,
      challengeId,
      rewards: {
        xp: 100,
        coins: 25,
        achievements: ['Challenge Completed'],
      },
      message: 'Challenge completed successfully',
    };
  }

  private getNextLevelXp(level: number): number {
    // Simple XP calculation for next level
    return level * 1000;
  }

  private getChallengeTarget(challengeType: string, difficulty?: string): any {
    const targets = {
      vocabulary: {
        easy: { words: 10, time: 300 },
        medium: { words: 25, time: 600 },
        hard: { words: 50, time: 900 },
      },
      grammar: {
        easy: { exercises: 5, accuracy: 80 },
        medium: { exercises: 10, accuracy: 85 },
        hard: { exercises: 15, accuracy: 90 },
      },
      pronunciation: {
        easy: { attempts: 5, score: 70 },
        medium: { attempts: 10, score: 75 },
        hard: { attempts: 15, score: 80 },
      },
    };

    const difficultyLevel = difficulty || 'medium';
    return targets[challengeType]?.[difficultyLevel] || targets.vocabulary.medium;
  }
}