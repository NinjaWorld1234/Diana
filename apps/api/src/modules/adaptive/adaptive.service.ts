import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Adaptive Engine — محرك التكيف
 * 
 * 5 Decision Paths:
 * 1. ✅ Understanding + Application + Reasoning → Open next node + points + mastery
 * 2. ✅ Understanding + ❌ Application → Show worked example + similar question
 * 3. ✅ Understanding + ✅ Application + ❌ Reasoning → Causal hint + equivalent question
 * 4. ❌ Understanding → Definition/rephrasing + alternative question
 * 5. ❌ Multiple → Support card + review
 */


@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}


  /**
   * Get the current mastery state for a user across all nodes
   */
  async getUserMasteryMap(userId: string, role?: string) {
    const isPrivileged = role === 'TEACHER' || role === 'ADMIN';

    const progress = await this.prisma.nodeProgress.findMany({
      where: { userId },
      include: { node: true },
      orderBy: { node: { order: 'asc' } },
    });

    const nodes = await this.prisma.conceptNode.findMany({
      orderBy: { order: 'asc' },
    });

    return nodes.map((node) => {
      const p = progress.find((pr) => pr.nodeId === node.id);
      return {
        nodeId: node.id,
        titleAr: node.titleAr,
        order: node.order,
        // Teachers & Admins: all nodes are open
        status: isPrivileged ? (p?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS') : (p?.status ?? 'LOCKED'),
        masteryScore: p?.masteryScore ?? 0,
        understandingScore: p?.understandingScore ?? 0,
        applicationScore: p?.applicationScore ?? 0,
        reasoningScore: p?.reasoningScore ?? 0,
        attemptsCount: p?.attemptsCount ?? 0,
        hintsCount: p?.hintsCount ?? 0,
        timeSpentSeconds: p?.timeSpentSeconds ?? 0,
        icon: node.icon,
        color: node.color,
        needsReview: node.needsReview,
      };
    });
  }

  /**
   * Check if user should be redirected to review based on < 70% after multiple attempts
   */
  async checkForReview(userId: string, nodeId: string): Promise<boolean> {
    const progress = await this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
    });
    if (!progress) return false;
    return progress.attemptsCount >= 3 && progress.masteryScore < 70;
  }

  /**
   * Initialize progress for first node (make it OPEN)
   */
  async initializeProgress(userId: string, role?: string) {
    const isPrivileged = role === 'TEACHER' || role === 'ADMIN';

    if (isPrivileged) {
      // Teachers & Admins: open all nodes at once
      const allNodes = await this.prisma.conceptNode.findMany();
      for (const node of allNodes) {
        await this.prisma.nodeProgress.upsert({
          where: { userId_nodeId: { userId, nodeId: node.id } },
          create: { userId, nodeId: node.id, status: 'IN_PROGRESS' },
          update: { status: 'IN_PROGRESS' },
        });
      }
    } else {
      // Students: only open the first node
      const firstNode = await this.prisma.conceptNode.findFirst({
        orderBy: { order: 'asc' },
      });
      if (!firstNode) return;

      await this.prisma.nodeProgress.upsert({
        where: { userId_nodeId: { userId, nodeId: firstNode.id } },
        create: { userId, nodeId: firstNode.id, status: 'IN_PROGRESS' },
        update: {},
      });
    }
  }


  /**
   * Mark a level as read to unlock the next sub-node.
   * This artificially sets the score to 100 for understanding or application
   * without affecting the overall mastery score until the final exam.
   */
  async markLevelAsRead(userId: string, nodeId: string, level: 'understanding' | 'application') {
    const progress = await this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
    });

    const currentScores = {
      understandingScore: progress?.understandingScore ?? 0,
      applicationScore: progress?.applicationScore ?? 0,
      reasoningScore: progress?.reasoningScore ?? 0,
    };

    if (level === 'understanding') currentScores.understandingScore = 100;
    if (level === 'application') currentScores.applicationScore = 100;

    await this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: {
        userId,
        nodeId,
        status: 'IN_PROGRESS',
        ...currentScores,
        masteryScore: progress?.masteryScore ?? 0,
        attemptsCount: 1,
      },
      update: {
        ...currentScores,
      },
    });

    return { message: 'تم إكمال القراءة بنجاح', passed: true };
  }

  /**
   * Evaluate the entire node exam (Understanding + Application + Reasoning questions).
   */
  async evaluateExam(userId: string, nodeId: string) {
    const allQuestions = await this.prisma.question.findMany({
      where: { nodeId, isActive: true },
      select: { id: true, level: true },
    });

    const questionIds = allQuestions.map((q) => q.id);
    const attempts = await this.prisma.questionAttempt.findMany({
      where: { userId, questionId: { in: questionIds } },
      orderBy: { createdAt: 'desc' },
    });

    const latestByQuestion = new Map<string, { isCorrect: boolean }>();
    for (const a of attempts) {
      if (!latestByQuestion.has(a.questionId)) {
        latestByQuestion.set(a.questionId, { isCorrect: a.isCorrect });
      }
    }

    const calculateLevelScore = (levelEnum: string) => {
      const qIds = allQuestions.filter((q) => q.level === levelEnum).map((q) => q.id);
      const total = qIds.length;
      if (total === 0) return 100; // If no questions, pass by default
      const correct = qIds.filter((id) => latestByQuestion.get(id)?.isCorrect).length;
      return (correct / total) * 100;
    };

    const progress = await this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
    });
    const hintsUsed = progress?.hintsCount ?? 0;
    const hintPenalty = hintsUsed * 5;

    let understandingRaw = calculateLevelScore('UNDERSTANDING');
    let applicationRaw = calculateLevelScore('APPLICATION');
    let reasoningRaw = calculateLevelScore('REASONING');

    // Apply penalty to the total mastery, or per level. For simplicity, we apply to final mastery.
    const rawMastery = (understandingRaw + applicationRaw + reasoningRaw) / 3;
    const masteryScore = Math.max(0, Math.min(100, rawMastery - hintPenalty));
    const passed = masteryScore >= 50;

    const currentScores = {
      understandingScore: passed ? 100 : Math.max(0, understandingRaw - hintPenalty),
      applicationScore: passed ? 100 : Math.max(0, applicationRaw - hintPenalty),
      reasoningScore: passed ? 100 : Math.max(0, reasoningRaw - hintPenalty),
    };

    const allComplete = passed;

    await this.prisma.$transaction(async (tx) => {
      await tx.nodeProgress.upsert({
        where: { userId_nodeId: { userId, nodeId } },
        create: {
          userId,
          nodeId,
          status: allComplete ? 'COMPLETED' : 'IN_PROGRESS',
          ...currentScores,
          masteryScore,
          attemptsCount: 1,
        },
        update: {
          status: allComplete ? 'COMPLETED' : 'IN_PROGRESS',
          ...currentScores,
          masteryScore,
          attemptsCount: { increment: 1 },
        },
      });

      const prog = await tx.nodeProgress.findUnique({
        where: { userId_nodeId: { userId, nodeId } },
      });
      if (prog) {
        await tx.masterySnapshot.create({
          data: { progressId: prog.id, masteryScore },
        });
      }

      if (allComplete) {
        const currentNode = await tx.conceptNode.findUnique({ where: { id: nodeId } });
        if (currentNode) {
          const nextNode = await tx.conceptNode.findFirst({
            where: { order: { gt: currentNode.order } },
            orderBy: { order: 'asc' },
          });
          if (nextNode) {
            const existing = await tx.nodeProgress.findUnique({
              where: { userId_nodeId: { userId, nodeId: nextNode.id } }
            });
            if (!existing || existing.status === 'LOCKED') {
              await tx.nodeProgress.upsert({
                where: { userId_nodeId: { userId, nodeId: nextNode.id } },
                create: { userId, nodeId: nextNode.id, status: 'IN_PROGRESS' },
                update: { status: 'IN_PROGRESS' },
              });
            }
          }
        }
      }
    });

    return {
      passed,
      allComplete,
      masteryScore: Math.round(masteryScore),
      hintPenalty,
      message: passed
        ? 'أحسنت! لقد اجتزت الامتحان الشامل بنجاح وتم فتح العقدة التالية.'
        : `لقد حصلت على ${Math.round(masteryScore)}%. يرجى مراجعة المحتوى والمحاولة مرة أخرى.`,
    };
  }


}
