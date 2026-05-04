import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async getNodeQuestions(nodeId: string, level?: string, variant?: string) {
    return this.prisma.question.findMany({
      where: {
        nodeId,
        isActive: true,
        ...(level ? { level: level as any } : {}),
        ...(variant ? { variant: variant as any } : {}),
      },
      include: {
        options: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async getQuestion(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: 'asc' } } },
    });
  }

  async submitAnswer(userId: string, questionId: string, selectedOptionId: string, timeSeconds: number) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) throw new Error('سؤال غير موجود');

    const selectedOption = question.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect ?? false;

    const attempt = await this.prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        selectedOptionId,
        isCorrect,
        timeSeconds,
      },
    });

    return {
      attempt,
      isCorrect,
      correctOption: question.options.find((o) => o.isCorrect),
      explanation: question.explanationAr,
    };
  }

  async getHints(nodeId: string, level?: string) {
    return this.prisma.hint.findMany({
      where: {
        nodeId,
        ...(level ? { level: level as any } : {}),
      },
    });
  }

  async getRemediationCards(nodeId: string, level?: string) {
    return this.prisma.remediationCard.findMany({
      where: {
        nodeId,
        ...(level ? { level: level as any } : {}),
      },
    });
  }
}
