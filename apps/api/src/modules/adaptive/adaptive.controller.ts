import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdaptiveService } from './adaptive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EvaluateLevelDto } from '../../common/dto/api.dto';

@ApiTags('المحرك التكيفي')
@Controller('adaptive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}


  /** إكمال قراءة مستوى فرعي (فهم أو تطبيق) بدون أسئلة */
  @Post('mark-read')
  markRead(
    @Req() req: any,
    @Body() body: { nodeId: string; level: 'understanding' | 'application' },
  ) {
    return this.adaptiveService.markLevelAsRead(req.user.sub, body.nodeId, body.level);
  }

  /** تقييم العقدة بالكامل بعد الانتهاء من جميع الأسئلة */
  @Post('evaluate-exam')
  evaluateExam(
    @Req() req: any,
    @Body() body: { nodeId: string },
  ) {
    return this.adaptiveService.evaluateExam(req.user.sub, body.nodeId);
  }

  @Get('mastery-map')
  getMasteryMap(@Req() req: any) {
    return this.adaptiveService.getUserMasteryMap(req.user.sub, req.user.role);
  }

  @Get('check-review/:nodeId')
  checkReview(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.adaptiveService.checkForReview(req.user.sub, nodeId);
  }

  @Post('initialize')
  initialize(@Req() req: any) {
    return this.adaptiveService.initializeProgress(req.user.sub, req.user.role);
  }
}
