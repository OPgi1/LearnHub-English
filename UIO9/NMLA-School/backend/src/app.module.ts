import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProgressModule } from './modules/progress/progress.module';
import { AiModule } from './modules/ai/ai.module';
import { VoiceModule } from './modules/voice/voice.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AdminModule } from './modules/admin/admin.module';
import { CmsModule } from './modules/cms/cms.module';

// Import entities
import { User } from './modules/users/entities/user.entity';
import { UserProfile } from './modules/users/entities/user-profile.entity';
import { UserProgress } from './modules/progress/entities/user-progress.entity';
import { Vocabulary } from './modules/vocabulary/entities/vocabulary.entity';
import { Sentence } from './modules/vocabulary/entities/sentence.entity';
import { GrammarRule } from './modules/grammar/entities/grammar-rule.entity';
import { Lesson } from './modules/lessons/entities/lesson.entity';
import { Exercise } from './modules/exercises/entities/exercise.entity';
import { PronunciationAttempt } from './modules/voice/entities/pronunciation-attempt.entity';
import { AiInteraction } from './modules/ai/entities/ai-interaction.entity';
import { Achievement } from './modules/gamification/entities/achievement.entity';
import { UserAchievement } from './modules/gamification/entities/user-achievement.entity';
import { VoiceSample } from './modules/voice/entities/voice-sample.entity';
import { ContentRecommendation } from './modules/ai/entities/content-recommendation.entity';
import { UserAnalytics } from './modules/progress/entities/user-analytics.entity';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_DATABASE', 'nmla_school'),
        entities: [
          User,
          UserProfile,
          UserProgress,
          Vocabulary,
          Sentence,
          GrammarRule,
          Lesson,
          Exercise,
          PronunciationAttempt,
          AiInteraction,
          Achievement,
          UserAchievement,
          VoiceSample,
          ContentRecommendation,
          UserAnalytics,
        ],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
        logging: configService.get<boolean>('DB_LOGGING', false),
        ssl: configService.get<boolean>('DB_SSL', false),
      }),
      inject: [ConfigService],
    }),

    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    VocabularyModule,
    GrammarModule,
    LessonsModule,
    ExercisesModule,
    ProgressModule,
    AiModule,
    VoiceModule,
    GamificationModule,
    AdminModule,
    CmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}