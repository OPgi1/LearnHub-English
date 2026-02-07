import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OpenAIService } from './services/openai.service';
import { ContentGenerationService } from './services/content-generation.service';
import { RecommendationService } from './services/recommendation.service';
import { ContentRecommendation } from './entities/content-recommendation.entity';

@ApiTags('AI Services')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private openaiService: OpenAIService,
    private contentGenerationService: ContentGenerationService,
    private recommendationService: RecommendationService,
  ) {}

  @Post('tutor')
  @ApiOperation({ summary: 'Get AI tutor response' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  async getTutorResponse(
    @CurrentUser() user: User,
    @Body() body: {
      message: string;
      context?: any;
    },
  ) {
    const response = await this.openaiService.generateTutorResponse(
      user.id,
      `session_${Date.now()}`,
      `conversation_${Date.now()}`,
      body.message,
      body.context || {},
    );

    return {
      success: true,
      response,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('vocabulary/example')
  @ApiOperation({ summary: 'Generate vocabulary example' })
  @ApiResponse({ status: 200, description: 'Vocabulary example generated successfully' })
  async generateVocabularyExample(
    @CurrentUser() user: User,
    @Body() body: {
      word: string;
      level: string;
      context?: string;
    },
  ) {
    const example = await this.openaiService.generateVocabularyExample(
      body.word,
      body.level,
      body.context || '',
    );

    return {
      success: true,
      example,
      word: body.word,
      level: body.level,
    };
  }

  @Post('grammar/explanation')
  @ApiOperation({ summary: 'Generate grammar explanation' })
  @ApiResponse({ status: 200, description: 'Grammar explanation generated successfully' })
  async generateGrammarExplanation(
    @CurrentUser() user: User,
    @Body() body: {
      rule: string;
      level: string;
      context?: string;
    },
  ) {
    const explanation = await this.openaiService.generateGrammarExplanation(
      body.rule,
      body.level,
      body.context || '',
    );

    return {
      success: true,
      explanation,
      rule: body.rule,
      level: body.level,
    };
  }

  @Post('writing/analyze')
  @ApiOperation({ summary: 'Analyze writing exercise' })
  @ApiResponse({ status: 200, description: 'Writing analysis completed successfully' })
  async analyzeWriting(
    @CurrentUser() user: User,
    @Body() body: {
      text: string;
      level: string;
      taskType?: string;
    },
  ) {
    const analysis = await this.openaiService.analyzeWriting(
      body.text,
      body.level,
      body.taskType || 'general',
    );

    return {
      success: true,
      analysis,
      textLength: body.text.length,
    };
  }

  @Post('content/vocabulary')
  @ApiOperation({ summary: 'Generate vocabulary content' })
  @ApiResponse({ status: 200, description: 'Vocabulary content generated successfully' })
  async generateVocabularyContent(
    @CurrentUser() user: User,
    @Body() body: {
      word: string;
      level: string;
      context?: string;
    },
  ) {
    const content = await this.contentGenerationService.generateVocabularyContent(
      body.word,
      body.level,
      body.context || '',
    );

    return {
      success: true,
      content,
      word: body.word,
      level: body.level,
    };
  }

  @Post('content/grammar')
  @ApiOperation({ summary: 'Generate grammar content' })
  @ApiResponse({ status: 200, description: 'Grammar content generated successfully' })
  async generateGrammarContent(
    @CurrentUser() user: User,
    @Body() body: {
      rule: string;
      level: string;
      context?: string;
    },
  ) {
    const content = await this.contentGenerationService.generateGrammarContent(
      body.rule,
      body.level,
      body.context || '',
    );

    return {
      success: true,
      content,
      rule: body.rule,
      level: body.level,
    };
  }

  @Post('content/exercise')
  @ApiOperation({ summary: 'Generate practice exercise' })
  @ApiResponse({ status: 200, description: 'Practice exercise generated successfully' })
  async generatePracticeExercise(
    @CurrentUser() user: User,
    @Body() body: {
      type: string;
      level: string;
      topic: string;
      count?: number;
    },
  ) {
    const exercises = await this.contentGenerationService.generatePracticeExercise(
      body.type,
      body.level,
      body.topic,
      body.count || 5,
    );

    return {
      success: true,
      exercises,
      type: body.type,
      level: body.level,
      topic: body.topic,
      count: exercises.length,
    };
  }

  @Post('content/reading')
  @ApiOperation({ summary: 'Generate reading comprehension' })
  @ApiResponse({ status: 200, description: 'Reading comprehension generated successfully' })
  async generateReadingComprehension(
    @CurrentUser() user: User,
    @Body() body: {
      level: string;
      topic: string;
      wordCount?: number;
    },
  ) {
    const reading = await this.contentGenerationService.generateReadingComprehension(
      body.level,
      body.topic,
      body.wordCount || 200,
    );

    return {
      success: true,
      reading,
      level: body.level,
      topic: body.topic,
    };
  }

  @Post('content/writing')
  @ApiOperation({ summary: 'Generate writing prompt' })
  @ApiResponse({ status: 200, description: 'Writing prompt generated successfully' })
  async generateWritingPrompt(
    @CurrentUser() user: User,
    @Body() body: {
      level: string;
      topic: string;
      wordLimit?: number;
    },
  ) {
    const prompt = await this.contentGenerationService.generateWritingPrompt(
      body.level,
      body.topic,
      body.wordLimit || 150,
    );

    return {
      success: true,
      prompt,
      level: body.level,
      topic: body.topic,
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized content recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(
    @CurrentUser() user: User,
  ): Promise<ContentRecommendation[]> {
    return this.recommendationService.generatePersonalizedRecommendations(user.id);
  }

  @Get('recommendations/user')
  @ApiOperation({ summary: 'Get user recommendations' })
  @ApiResponse({ status: 200, description: 'User recommendations retrieved successfully' })
  async getUserRecommendations(
    @CurrentUser() user: User,
  ): Promise<ContentRecommendation[]> {
    return this.recommendationService.getUserRecommendations(user.id);
  }

  @Post('recommendations/mark-consumed/:id')
  @ApiOperation({ summary: 'Mark recommendation as consumed' })
  @ApiResponse({ status: 200, description: 'Recommendation marked as consumed' })
  async markRecommendationConsumed(
    @CurrentUser() user: User,
    @Param('id') recommendationId: string,
  ) {
    // This would implement marking a recommendation as consumed
    return {
      success: true,
      message: 'Recommendation marked as consumed',
      recommendationId,
    };
  }
}