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
   * SERVER-AUTHORITATIVE: Evaluate a single level by verifying actual DB attempts.
   * The backend reads QuestionAttempt records and hintsCount to compute the real score.
   * The frontend's `passed` parameter is IGNORED — the server is the source of truth.
   */
  async evaluateLevel(
    userId: string,
    nodeId: string,
    level: 'understanding' | 'application' | 'reasoning',
    _passed: boolean,  // kept for API compat — ignored internally
  ) {
    // ──────────────────────────────────────────────────────────────
    // 1. Fetch real questions for this node + level
    // ──────────────────────────────────────────────────────────────
    const levelEnum = level === 'understanding' ? 'UNDERSTANDING'
                    : level === 'application'   ? 'APPLICATION'
                    : 'REASONING';

    const levelQuestions = await this.prisma.question.findMany({
      where: { nodeId, level: levelEnum as any, isActive: true },
      select: { id: true, points: true },
    });

    // ──────────────────────────────────────────────────────────────
    // 2. For each question, find the student's LATEST attempt
    // ──────────────────────────────────────────────────────────────
    let totalQuestions = levelQuestions.length;
    let correctCount = 0;

    if (totalQuestions > 0) {
      const questionIds = levelQuestions.map((q) => q.id);
      const attempts = await this.prisma.questionAttempt.findMany({
        where: {
          userId,
          questionId: { in: questionIds },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Latest attempt per question
      const latestByQuestion = new Map<string, { isCorrect: boolean }>();
      for (const a of attempts) {
        if (!latestByQuestion.has(a.questionId)) {
          latestByQuestion.set(a.questionId, { isCorrect: a.isCorrect });
        }
      }

      correctCount = [...latestByQuestion.values()].filter((a) => a.isCorrect).length;
    }

    // ──────────────────────────────────────────────────────────────
    // 3. Factor in hints penalty: each hint used costs -5 from the score
    // ──────────────────────────────────────────────────────────────
    const progress = await this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
    });
    const hintsUsed = progress?.hintsCount ?? 0;

    // Base score: percentage of correct answers
    const rawScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    // Penalty: -5 per hint, floored at 0
    const hintPenalty = hintsUsed * 5;
    const levelScore = Math.max(0, Math.min(100, rawScore - hintPenalty));

    // Pass threshold: 50% after penalties. If no questions exist, pass automatically to prevent softlock.
    const passed = totalQuestions === 0 ? true : levelScore >= 50;

    // ──────────────────────────────────────────────────────────────
    // 4. Compute new aggregate scores (preserve other levels)
    // ──────────────────────────────────────────────────────────────
    const currentScores = {
      understandingScore: progress?.understandingScore ?? 0,
      applicationScore: progress?.applicationScore ?? 0,
      reasoningScore: progress?.reasoningScore ?? 0,
    };

    const scoreField = level === 'understanding' ? 'understandingScore'
                     : level === 'application' ? 'applicationScore'
                     : 'reasoningScore';
    currentScores[scoreField] = passed ? 100 : 0;

    // Calculate mastery
    const masteryScore = (currentScores.understandingScore + currentScores.applicationScore + currentScores.reasoningScore) / 3;

    // Check if all 3 levels are now complete
    const allComplete = currentScores.understandingScore >= 100
                     && currentScores.applicationScore >= 100
                     && currentScores.reasoningScore >= 100;

    // ──────────────────────────────────────────────────────────────
    // 5. Persist inside a transaction for atomicity
    // ──────────────────────────────────────────────────────────────
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

      // Create mastery snapshot inside the same transaction
      const prog = await tx.nodeProgress.findUnique({
        where: { userId_nodeId: { userId, nodeId } },
      });
      if (prog) {
        await tx.masterySnapshot.create({
          data: { progressId: prog.id, masteryScore },
        });
      }

      // If all complete, unlock next node
      if (allComplete) {
        const currentNode = await tx.conceptNode.findUnique({ where: { id: nodeId } });
        if (currentNode) {
          const nextNode = await tx.conceptNode.findFirst({
            where: { order: { gt: currentNode.order } },
            orderBy: { order: 'asc' },
          });
          if (nextNode) {
            await tx.nodeProgress.upsert({
              where: { userId_nodeId: { userId, nodeId: nextNode.id } },
              create: { userId, nodeId: nextNode.id, status: 'IN_PROGRESS' },
              update: {}, // Do not override if already IN_PROGRESS or COMPLETED
            });
          }
        }
      }
    });

    return {
      level,
      passed,
      allComplete,
      masteryScore,
      correctCount,
      totalQuestions,
      levelScore: Math.round(levelScore),
      hintPenalty,
      message: totalQuestions === 0
        ? 'تم اجتياز المستوى تلقائياً لعدم وجود أسئلة حالياً.'
        : (!passed
          ? `لم تتجاوز هذا المستوى (${Math.round(levelScore)}%). حاول مرة أخرى بعد مراجعة المحتوى.`
          : allComplete
            ? 'أحسنت! أتقنت هذه العقدة بالكامل. تم فتح العقدة التالية.'
            : 'أحسنت! انتقل للعقدة الفرعية التالية.'),
    };
  }


}
