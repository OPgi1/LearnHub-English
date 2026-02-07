import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GrammarController } from './grammar.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  providers: [],
  controllers: [GrammarController],
  exports: [],
})
export class GrammarModule {}