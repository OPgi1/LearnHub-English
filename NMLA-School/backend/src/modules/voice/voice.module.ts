import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceService } from './voice.service';
import { PronunciationService } from './services/pronunciation.service';
import { AudioProcessingService } from './services/audio-processing.service';
import { PronunciationAttempt, PronunciationAttemptSchema } from './entities/pronunciation-attempt.entity';
import { VoiceSample, VoiceSampleSchema } from './entities/voice-sample.entity';
import { VoiceController } from './voice.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PronunciationAttempt.name, schema: PronunciationAttemptSchema },
      { name: VoiceSample.name, schema: VoiceSampleSchema },
    ]),
  ],
  providers: [
    VoiceService,
    PronunciationService,
    AudioProcessingService,
  ],
  controllers: [VoiceController],
  exports: [
    VoiceService,
    PronunciationService,
    AudioProcessingService,
  ],
})
export class VoiceModule {}