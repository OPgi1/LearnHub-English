import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsController } from './cms.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  providers: [],
  controllers: [CmsController],
  exports: [],
})
export class CmsModule {}