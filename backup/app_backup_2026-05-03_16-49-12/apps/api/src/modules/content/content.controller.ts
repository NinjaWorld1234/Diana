import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('المحتوى')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('unit')
  getUnit() {
    return this.contentService.getUnit();
  }

  @Get('nodes')
  getNodes() {
    return this.contentService.getNodes();
  }

  @Get('nodes/:id')
  getNode(@Param('id') id: string) {
    return this.contentService.getNode(id);
  }

  @Get('nodes/:id/content')
  getNodeContent(@Param('id') id: string) {
    return this.contentService.getNodeContent(id);
  }

  @Get('nodes/:id/formulas')
  getFormulas(@Param('id') id: string) {
    return this.contentService.getFormulas(id);
  }

  @Get('nodes/:id/tables')
  getTables(@Param('id') id: string) {
    return this.contentService.getTables(id);
  }

  @Get('nodes/:id/examples')
  getExamples(@Param('id') id: string) {
    return this.contentService.getExamples(id);
  }

  @Get('mini-games')
  getMiniGames() {
    return this.contentService.getMiniGames();
  }
}
