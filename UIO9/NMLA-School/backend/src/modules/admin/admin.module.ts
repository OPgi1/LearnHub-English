import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  providers: [],
  controllers: [AdminController],
  exports: [],
})
export class AdminModule {}