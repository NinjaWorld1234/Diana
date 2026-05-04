import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AdaptiveModule } from './modules/adaptive/adaptive.module';
import { ProgressModule } from './modules/progress/progress.module';
import { AiTeacherModule } from './modules/ai-teacher/ai-teacher.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContentModule,
    QuestionsModule,
    AdaptiveModule,
    ProgressModule,
    AiTeacherModule,
    CalculatorModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
