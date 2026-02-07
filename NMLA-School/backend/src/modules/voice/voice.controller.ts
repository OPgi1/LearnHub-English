import { Controller, Post, Body, Get, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';
import { PronunciationAttempt } from './entities/pronunciation-attempt.entity';

@ApiTags('Voice Services')
@Controller('voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  @Post('pronunciation/analyze')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sentenceId: { type: 'string' },
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Analyze pronunciation' })
  @ApiResponse({ status: 200, description: 'Pronunciation analysis completed successfully' })
  async analyzePronunciation(
    @CurrentUser() user: User,
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: {
      sentenceId: string;
    },
  ) {
    if (!audio) {
      throw new Error('Audio file is required');
    }

    const result = await this.voiceService.analyzePronunciation(
      user.id,
      body.sentenceId,
      audio.buffer,
    );

    return {
      success: true,
      result,
      message: 'Pronunciation analysis completed',
    };
  }

  @Post('practice/session')
  @ApiOperation({ summary: 'Generate practice session' })
  @ApiResponse({ status: 200, description: 'Practice session generated successfully' })
  async generatePracticeSession(
    @CurrentUser() user: User,
    @Body() body: {
      difficulty?: string;
    },
  ) {
    const session = await this.voiceService.generatePracticeSession(
      user.id,
      body.difficulty || 'medium',
    );

    return {
      success: true,
      session,
      message: 'Practice session generated',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get pronunciation practice history' })
  @ApiResponse({ status: 200, description: 'Practice history retrieved successfully' })
  async getPracticeHistory(
    @CurrentUser() user: User,
    @Body() body: {
      limit?: number;
    },
  ) {
    const history = await this.voiceService.getPracticeHistory(
      user.id,
      body.limit || 20,
    );

    return {
      success: true,
      history,
      count: history.length,
    };
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get pronunciation progress report' })
  @ApiResponse({ status: 200, description: 'Progress report generated successfully' })
  async getProgressReport(
    @CurrentUser() user: User,
  ) {
    const report = await this.voiceService.getProgressReport(user.id);

    return {
      success: true,
      report,
      message: 'Progress report generated',
    };
  }

  @Post('sample/save')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sampleType: { type: 'string', enum: ['pronunciation', 'speaking', 'reading'] },
        audio: {
          type: 'string',
          format: 'binary',
        },
        metadata: {
          type: 'object',
          properties: {
            transcription: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Save voice sample' })
  @ApiResponse({ status: 200, description: 'Voice sample saved successfully' })
  async saveVoiceSample(
    @CurrentUser() user: User,
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: {
      sampleType: string;
      metadata?: any;
    },
  ) {
    if (!audio) {
      throw new Error('Audio file is required');
    }

    const voiceSample = await this.voiceService.saveVoiceSample(
      user.id,
      body.sampleType,
      audio.buffer,
      body.metadata,
    );

    return {
      success: true,
      voiceSample,
      message: 'Voice sample saved successfully',
    };
  }

  @Get('samples')
  @ApiOperation({ summary: 'Get user voice samples' })
  @ApiResponse({ status: 200, description: 'Voice samples retrieved successfully' })
  async getUserVoiceSamples(
    @CurrentUser() user: User,
    @Body() body: {
      sampleType?: string;
      limit?: number;
    },
  ) {
    // This would implement retrieving user voice samples
    // For now, return a mock response
    return {
      success: true,
      samples: [],
      count: 0,
      message: 'Voice samples retrieved successfully',
    };
  }

  @Post('feedback/:attemptId')
  @ApiOperation({ summary: 'Get detailed feedback for pronunciation attempt' })
  @ApiResponse({ status: 200, description: 'Detailed feedback retrieved successfully' })
  async getDetailedFeedback(
    @CurrentUser() user: User,
    @Param('attemptId') attemptId: string,
  ) {
    // This would implement retrieving detailed feedback for a specific attempt
    // For now, return a mock response
    return {
      success: true,
      feedback: {
        overallScore: 85,
        detailedAnalysis: {
          pronunciation: 'Good',
          fluency: 'Needs improvement',
          accuracy: 'Excellent',
        },
        suggestions: [
          'Practice linking words together',
          'Work on stress and intonation',
          'Slow down your speech',
        ],
      },
      message: 'Detailed feedback retrieved',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get voice practice statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getVoiceStatistics(
    @CurrentUser() user: User,
  ) {
    // This would implement calculating voice practice statistics
    // For now, return a mock response
    return {
      success: true,
      statistics: {
        totalAttempts: 45,
        averageScore: 78,
        bestScore: 95,
        practiceDays: 15,
        totalPracticeTime: 120, // minutes
      },
      message: 'Voice statistics retrieved',
    };
  }

  @Post('challenge/start')
  @ApiOperation({ summary: 'Start voice challenge' })
  @ApiResponse({ status: 200, description: 'Voice challenge started successfully' })
  async startVoiceChallenge(
    @CurrentUser() user: User,
    @Body() body: {
      challengeType: string;
      difficulty?: string;
    },
  ) {
    // This would implement starting a voice challenge
    // For now, return a mock response
    return {
      success: true,
      challenge: {
        id: `challenge_${Date.now()}`,
        type: body.challengeType,
        difficulty: body.difficulty || 'medium',
        duration: 300, // seconds
        targetScore: 80,
      },
      message: 'Voice challenge started',
    };
  }

  @Post('challenge/submit/:challengeId')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Submit voice challenge' })
  @ApiResponse({ status: 200, description: 'Voice challenge submitted successfully' })
  async submitVoiceChallenge(
    @CurrentUser() user: User,
    @Param('challengeId') challengeId: string,
    @UploadedFile() audio: Express.Multer.File,
  ) {
    if (!audio) {
      throw new Error('Audio file is required');
    }

    // This would implement processing the challenge submission
    // For now, return a mock response
    return {
      success: true,
      result: {
        challengeId,
        score: 85,
        passed: true,
        rewards: {
          xp: 50,
          coins: 10,
        },
      },
      message: 'Voice challenge submitted successfully',
    };
  }
}