import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('التقدم')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get()
  getUserProgress(@Req() req: any) {
    return this.progressService.getUserProgress(req.user.sub);
  }

  @Get('node/:nodeId')
  getNodeProgress(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.progressService.getNodeProgress(req.user.sub, nodeId);
  }

  @Post('time')
  updateTimeSpent(@Req() req: any, @Body() body: { nodeId: string; seconds: number }) {
    return this.progressService.updateTimeSpent(req.user.sub, body.nodeId, body.seconds);
  }

  @Post('hint')
  useHint(@Req() req: any, @Body() body: { nodeId: string }) {
    return this.progressService.useHint(req.user.sub, body.nodeId);
  }

  @Get('achievements')
  getAchievements(@Req() req: any) {
    return this.progressService.getAchievements(req.user.sub);
  }
}
