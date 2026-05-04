import { Module } from '@nestjs/common';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';
import { QuestionsModule } from '../questions/questions.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [QuestionsModule, ProgressModule],
  controllers: [AdaptiveController],
  providers: [AdaptiveService],
  exports: [AdaptiveService],
})
export class AdaptiveModule {}
