import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonController } from './lesson.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  providers: [],
  controllers: [LessonController],
  exports: [],
})
export class LessonModule {}