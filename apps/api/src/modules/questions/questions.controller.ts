import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitAnswerDto, UseHintDto } from '../../common/dto/api.dto';

@ApiTags('الأسئلة')
@Controller('questions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get('node/:nodeId')
  getNodeQuestions(
    @Param('nodeId') nodeId: string,
    @Query('level') level?: string,
    @Query('variant') variant?: string,
  ) {
    return this.questionsService.getNodeQuestions(nodeId, level, variant);
  }

  @Get(':id')
  getQuestion(@Param('id') id: string) {
    return this.questionsService.getQuestion(id);
  }

  @Post('submit')
  submitAnswer(
    @Req() req: any,
    @Body() body: SubmitAnswerDto,
  ) {
    return this.questionsService.submitAnswer(
      req.user.sub,
      body.questionId,
      body.selectedOptionId,
      body.timeSeconds,
    );
  }

  @Get('hints/:nodeId')
  getHints(@Param('nodeId') nodeId: string, @Query('level') level?: string) {
    return this.questionsService.getHints(nodeId, level);
  }

  @Post('hints/use')
  useHint(
    @Req() req: any,
    @Body() body: UseHintDto,
  ) {
    return this.questionsService.useHint(req.user.sub, body.nodeId, body.hintId);
  }

  @Get('remediation/:nodeId')
  getRemediation(@Param('nodeId') nodeId: string, @Query('level') level?: string) {
    return this.questionsService.getRemediationCards(nodeId, level);
  }
}
