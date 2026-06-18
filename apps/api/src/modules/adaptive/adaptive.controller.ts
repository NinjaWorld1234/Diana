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


  /** تقييم مستوى واحد فقط (عقدة فرعية واحدة) */
  @Post('evaluate-level')
  evaluateLevel(
    @Req() req: any,
    @Body() body: EvaluateLevelDto,
  ) {
    return this.adaptiveService.evaluateLevel(req.user.sub, body.nodeId, body.level, body.passed);
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
