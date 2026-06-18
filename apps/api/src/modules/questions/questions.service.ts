import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!question) throw new NotFoundException('سؤال غير موجود');

    let isCorrect = false;
    let finalSelectedId: string | null = null;

    if (question.type === 'ORDER' || question.type === 'DRAG_DROP') {
      // For ORDER and DRAG_DROP, selectedOptionId is an array of option IDs in the user's order
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

    // ── Count how many previous wrong attempts the student had on THIS question ──
    const previousAttempts = await this.prisma.questionAttempt.count({
      where: { userId, questionId, isCorrect: false },
    });
    const currentStrikeCount = isCorrect ? previousAttempts : previousAttempts + 1;

    // ── Count how many hints the student has used for this node ──
    const nodeProgress = await this.prisma.nodeProgress.findFirst({
      where: { userId, nodeId: question.nodeId },
      select: { hintsCount: true },
    });
    const hintsUsedSoFar = nodeProgress?.hintsCount ?? 0;

    const attempt = await this.prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        selectedOptionId: finalSelectedId,
        isCorrect,
        timeSeconds,
        strikeCount: currentStrikeCount,
        hintsUsed: hintsUsedSoFar,
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

  /**
   * Use a hint — increments hintsCount in nodeProgress (single source of truth).
   * Verifies if hint was already unlocked by the student to avoid duplicate penalties.
   */
  async useHint(userId: string, nodeId: string, hintId: string) {
    const hint = await this.prisma.hint.findUnique({ where: { id: hintId } });
    if (!hint) throw new NotFoundException('التلميح غير موجود');

    await this.prisma.$transaction(async (tx) => {
      // Check if this hint was already unlocked by this user
      const alreadyUsed = await tx.analyticsEvent.findFirst({
        where: {
          userId,
          eventType: 'USE_HINT',
          payloadJson: {
            equals: { hintId, nodeId },
          },
        },
      });

      if (!alreadyUsed) {
        // Record the hint usage to prevent future duplicate penalty
        await tx.analyticsEvent.create({
          data: {
            userId,
            eventType: 'USE_HINT',
            payloadJson: { hintId, nodeId },
          },
        });

        // Increment hint count in progress (upsert to avoid crash if no progress exists)
        await tx.nodeProgress.upsert({
          where: { userId_nodeId: { userId, nodeId } },
          create: { userId, nodeId, status: 'IN_PROGRESS', hintsCount: 1 },
          update: { hintsCount: { increment: 1 } },
        });
      }
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
