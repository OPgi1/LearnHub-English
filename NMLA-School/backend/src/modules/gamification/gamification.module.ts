import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementService } from './services/achievement.service';
import { LeaderboardService } from './services/leaderboard.service';
import { RewardService } from './services/reward.service';
import { Achievement, AchievementSchema } from './entities/achievement.entity';
import { UserAchievement, UserAchievementSchema } from './entities/user-achievement.entity';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ]),
  ],
  providers: [
    AchievementService,
    LeaderboardService,
    RewardService,
  ],
  controllers: [GamificationController],
  exports: [
    AchievementService,
    LeaderboardService,
    RewardService,
  ],
})
export class GamificationModule {}