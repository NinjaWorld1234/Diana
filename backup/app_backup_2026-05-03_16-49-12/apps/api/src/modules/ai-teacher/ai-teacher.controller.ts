import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiTeacherService } from './ai-teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('المعلم الذكي')
@Controller('ai-teacher')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiTeacherController {
  constructor(private aiTeacherService: AiTeacherService) {}

  @Post('chat')
  chat(
    @Req() req: any,
    @Body() body: { message: string; sessionId?: string; nodeId?: string },
  ) {
    return this.aiTeacherService.chat(
      req.user.sub,
      body.sessionId || null,
      body.nodeId || null,
      body.message,
    );
  }

  @Get('sessions')
  getSessions(@Req() req: any) {
    return this.aiTeacherService.getUserSessions(req.user.sub);
  }

  @Get('sessions/:sessionId/history')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.aiTeacherService.getSessionHistory(sessionId);
  }
}
