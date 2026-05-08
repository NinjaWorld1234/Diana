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

  async submitAnswer(userId: string, questionId: string, selectedOptionId: string | string[], timeSeconds: number) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    if (!question) throw new Error('سؤال غير موجود');

    let isCorrect = false;
    let finalSelectedId: string | null = null;

    if (question.type === 'FILL_BLANK') {
      // For FILL_BLANK, compare text answer with correct option text
      const correctOption = question.options.find((o) => o.isCorrect);
      const userAnswer = String(selectedOptionId).trim().toLowerCase();
      const correctText = correctOption?.textAr?.trim().toLowerCase() || '';
      isCorrect = userAnswer === correctText;
      finalSelectedId = correctOption?.id || null;
    } else if (question.type === 'ORDER' || question.type === 'DRAG_DROP' || question.type === 'CLASSIFY') {
      // For ORDER, DRAG_DROP, and CLASSIFY: selectedOptionId is an array of option IDs
      const selectedIds = Array.isArray(selectedOptionId) 
        ? selectedOptionId 
        : (typeof selectedOptionId === 'string' ? selectedOptionId.split(',') : []);
        
      // Compare user's order with the correct order (options sorted by their 'order' field)
      isCorrect = question.options.length === selectedIds.length &&
        question.options.every((opt, index) => opt.id === selectedIds[index]);
      finalSelectedId = selectedIds[0] || null;
    } else {
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);
      isCorrect = selectedOption?.isCorrect ?? false;
      finalSelectedId = String(selectedOptionId);
    }

    const attempt = await this.prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        selectedOptionId: finalSelectedId,
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

  async useHint(userId: string, nodeId: string, hintId: string) {
    const hint = await this.prisma.hint.findUnique({ where: { id: hintId } });
    if (!hint) throw new Error('التلميح غير موجود');

    // Increment hint count in progress (upsert to avoid crash if no progress exists)
    await this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: { userId, nodeId, status: 'IN_PROGRESS', hintsCount: 1 },
      update: { hintsCount: { increment: 1 } },
    });

    return hint;
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
