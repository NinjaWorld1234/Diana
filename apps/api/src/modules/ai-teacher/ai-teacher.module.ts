import { Module } from '@nestjs/common';
import { AiTeacherController } from './ai-teacher.controller';
import { AiTeacherService } from './ai-teacher.service';
import { GeminiProvider } from './gemini.provider';

@Module({
  controllers: [AiTeacherController],
  providers: [AiTeacherService, GeminiProvider],
  exports: [AiTeacherService],
})
export class AiTeacherModule {}
