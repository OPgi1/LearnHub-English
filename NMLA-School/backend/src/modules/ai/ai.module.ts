import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenAIService } from './services/openai.service';
import { ContentGenerationService } from './services/content-generation.service';
import { RecommendationService } from './services/recommendation.service';
import { AiInteraction, AiInteractionSchema } from './entities/ai-interaction.entity';
import { ContentRecommendation, ContentRecommendationSchema } from './entities/content-recommendation.entity';
import { AiController } from './ai.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiInteraction.name, schema: AiInteractionSchema },
      { name: ContentRecommendation.name, schema: ContentRecommendationSchema },
    ]),
  ],
  providers: [
    OpenAIService,
    ContentGenerationService,
    RecommendationService,
  ],
  controllers: [AiController],
  exports: [
    OpenAIService,
    ContentGenerationService,
    RecommendationService,
  ],
})
export class AiModule {}