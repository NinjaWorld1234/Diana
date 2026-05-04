import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('التحليلات ولوحة المعلم')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('teacher/stats')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'احصائيات لوحة تحكم المعلم (المعلم/المدير فقط)' })
  getTeacherDashboardStats() {
    return this.analyticsService.getTeacherDashboardStats();
  }

  @Get('teacher/class-progress')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'قائمة تقدم جميع الطلاب (المعلم/المدير فقط)' })
  getClassProgressList() {
    return this.analyticsService.getClassProgressList();
  }
}
