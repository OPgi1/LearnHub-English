import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  providers: [],
  controllers: [ExerciseController],
  exports: [],
})
export class ExerciseModule {}