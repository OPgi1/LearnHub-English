import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './services/analytics.service';
import { LevelService } from './services/level.service';
import { UserProgress, UserProgressSchema } from './entities/user-progress.entity';
import { UserAnalytics, UserAnalyticsSchema } from './entities/user-analytics.entity';
import { LessonProgress, LessonProgressSchema } from './entities/lesson-progress.entity';
import { ExerciseAttempt, ExerciseAttemptSchema } from './entities/exercise-attempt.entity';
import { VocabularyProgress, VocabularyProgressSchema } from './entities/vocabulary-progress.entity';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: UserAnalytics.name, schema: UserAnalyticsSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: ExerciseAttempt.name, schema: ExerciseAttemptSchema },
      { name: VocabularyProgress.name, schema: VocabularyProgressSchema },
    ]),
  ],
  providers: [
    AnalyticsService,
    LevelService,
  ],
  controllers: [ProgressController],
  exports: [
    AnalyticsService,
    LevelService,
  ],
})
export class ProgressModule {}