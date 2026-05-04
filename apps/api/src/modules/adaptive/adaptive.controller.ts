import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdaptiveService } from './adaptive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('المحرك التكيفي')
@Controller('adaptive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}

  @Post('evaluate')
  evaluate(
    @Req() req: any,
    @Body() body: { nodeId: string; understanding: boolean; application: boolean; reasoning: boolean },
  ) {
    return this.adaptiveService.evaluate(req.user.sub, body.nodeId, {
      understanding: body.understanding,
      application: body.application,
      reasoning: body.reasoning,
    });
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
