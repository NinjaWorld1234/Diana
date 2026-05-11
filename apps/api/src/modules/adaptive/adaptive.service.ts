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
export type AdaptiveDecision = {
  path: 'MASTERY' | 'REMEDIATE_APPLICATION' | 'REMEDIATE_REASONING' | 'REMEDIATE_UNDERSTANDING' | 'FULL_REMEDIATION';
  nextAction: string;
  supportType?: string;
  nextQuestionVariant: string;
  shouldUnlockNext: boolean;
  pointsEarned: number;
  message: string;
};

@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}

  /**
   * Evaluate student performance on a node and decide next step
   */
  async evaluate(
    userId: string,
    nodeId: string,
    results: {
      understanding: boolean;
      application: boolean;
      reasoning: boolean;
    },
  ): Promise<AdaptiveDecision> {
    const { understanding, application, reasoning } = results;

    // Path 1:全部正解 → Mastery
    if (understanding && application && reasoning) {
      await this.updateProgress(userId, nodeId, {
        understandingScore: 100,
        applicationScore: 100,
        reasoningScore: 100,
        masteryScore: 100,
        status: 'COMPLETED',
      });
      await this.unlockNextNode(userId, nodeId);

      return {
        path: 'MASTERY',
        nextAction: 'UNLOCK_NEXT',
        shouldUnlockNext: true,
        nextQuestionVariant: 'MASTERY',
        pointsEarned: 30,
        message: 'أحسنت! أتقنت هذه العقدة بالكامل. تم فتح العقدة التالية.',
      };
    }

    // Path 2: Understanding ✅ + Application ❌
    if (understanding && !application) {
      await this.updateProgress(userId, nodeId, {
        understandingScore: 100,
        applicationScore: 0,
        reasoningScore: reasoning ? 100 : 0,
      });

      return {
        path: 'REMEDIATE_APPLICATION',
        nextAction: 'SHOW_WORKED_EXAMPLE',
        supportType: 'SOLVED_EXAMPLE',
        shouldUnlockNext: false,
        nextQuestionVariant: 'ALTERNATIVE',
        pointsEarned: 5,
        message: 'فهمك للمفهوم ممتاز! دعنا نراجع التطبيق من خلال مثال محلول.',
      };
    }

    // Path 3: Understanding ✅ + Application ✅ + Reasoning ❌
    if (understanding && application && !reasoning) {
      await this.updateProgress(userId, nodeId, {
        understandingScore: 100,
        applicationScore: 100,
        reasoningScore: 0,
      });

      return {
        path: 'REMEDIATE_REASONING',
        nextAction: 'SHOW_CAUSAL_HINT',
        supportType: 'CAUSAL',
        shouldUnlockNext: false,
        nextQuestionVariant: 'ALTERNATIVE',
        pointsEarned: 10,
        message: 'أداؤك في الفهم والتطبيق رائع! دعنا نعمل على الاستدلال.',
      };
    }

    // Path 4: Understanding ❌
    if (!understanding) {
      await this.updateProgress(userId, nodeId, {
        understandingScore: 0,
        applicationScore: 0,
        reasoningScore: 0,
      });

      return {
        path: 'REMEDIATE_UNDERSTANDING',
        nextAction: 'SHOW_DEFINITION',
        supportType: 'DEFINITION',
        shouldUnlockNext: false,
        nextQuestionVariant: 'REMEDIAL',
        pointsEarned: 0,
        message: 'لا بأس! دعنا نراجع المفهوم بتعريف مبسّط وأمثلة.',
      };
    }

    // Path 5: Multiple errors → Full remediation
    await this.updateProgress(userId, nodeId, {
      understandingScore: understanding ? 100 : 0,
      applicationScore: application ? 100 : 0,
      reasoningScore: reasoning ? 100 : 0,
    });

    const shouldReview = await this.checkForReview(userId, nodeId);
    if (shouldReview) {
      const prevNodeId = await this.lockNodeAndUnlockPrevious(userId, nodeId);
      return {
        path: 'FULL_REMEDIATION',
        nextAction: 'REDIRECT_PREVIOUS',
        supportType: 'COMPARISON',
        shouldUnlockNext: false,
        nextQuestionVariant: 'REMEDIAL',
        pointsEarned: 0,
        message: 'يبدو أنك تواجه صعوبة مستمرة في إتقان هذه المهارة. لقد تم إعادة توجيهك للمهارة السابقة للمراجعة.',
      };
    }

    return {
      path: 'FULL_REMEDIATION',
      nextAction: 'SHOW_SUPPORT_CARD',
      supportType: 'COMPARISON',
      shouldUnlockNext: false,
      nextQuestionVariant: 'REMEDIAL',
      pointsEarned: 0,
      message: 'لا تقلق! دعنا نراجع المفهوم من البداية بطريقة مبسطة.',
    };
  }

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

  private async updateProgress(
    userId: string,
    nodeId: string,
    data: {
      understandingScore?: number;
      applicationScore?: number;
      reasoningScore?: number;
      masteryScore?: number;
      status?: string;
    },
  ) {
    const masteryScore = data.masteryScore ??
      ((data.understandingScore ?? 0) + (data.applicationScore ?? 0) + (data.reasoningScore ?? 0)) / 3;

    const progress = await this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: {
        userId,
        nodeId,
        status: (data.status as any) ?? 'IN_PROGRESS',
        understandingScore: data.understandingScore ?? 0,
        applicationScore: data.applicationScore ?? 0,
        reasoningScore: data.reasoningScore ?? 0,
        masteryScore,
        attemptsCount: 1,
      },
      update: {
        ...(data.status ? { status: data.status as any } : {}),
        understandingScore: data.understandingScore,
        applicationScore: data.applicationScore,
        reasoningScore: data.reasoningScore,
        masteryScore,
        attemptsCount: { increment: 1 },
      },
    });

    // Create mastery snapshot
    await this.prisma.masterySnapshot.create({
      data: { progressId: progress.id, masteryScore },
    });

    return progress;
  }

  /**
   * Evaluate a single level (sub-node) instead of all 3 at once.
   * Updates only the specific level score, then checks if all 3 are complete.
   */
  async evaluateLevel(
    userId: string,
    nodeId: string,
    level: 'understanding' | 'application' | 'reasoning',
    passed: boolean,
  ) {
    // Get current progress
    const progress = await this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
    });

    const currentScores = {
      understandingScore: progress?.understandingScore ?? 0,
      applicationScore: progress?.applicationScore ?? 0,
      reasoningScore: progress?.reasoningScore ?? 0,
    };

    // Update the specific level
    const scoreField = level === 'understanding' ? 'understandingScore'
                     : level === 'application' ? 'applicationScore'
                     : 'reasoningScore';
    const newScore = passed ? 100 : 0;
    currentScores[scoreField] = newScore;

    // Calculate mastery
    const masteryScore = (currentScores.understandingScore + currentScores.applicationScore + currentScores.reasoningScore) / 3;

    // Check if all 3 levels are now complete
    const allComplete = currentScores.understandingScore >= 100
                     && currentScores.applicationScore >= 100
                     && currentScores.reasoningScore >= 100;

    await this.updateProgress(userId, nodeId, {
      ...currentScores,
      masteryScore,
      status: allComplete ? 'COMPLETED' : 'IN_PROGRESS',
    });

    if (allComplete) {
      await this.unlockNextNode(userId, nodeId);
    }

    return {
      level,
      passed,
      allComplete,
      masteryScore,
      message: !passed
        ? 'لا بأس! حاول مرة أخرى بعد مراجعة المحتوى.'
        : allComplete
          ? 'أحسنت! أتقنت هذه العقدة بالكامل. تم فتح العقدة التالية.'
          : 'أحسنت! انتقل للعقدة الفرعية التالية.',
    };
  }

  private async unlockNextNode(userId: string, nodeId: string) {
    const currentNode = await this.prisma.conceptNode.findUnique({ where: { id: nodeId } });
    if (!currentNode) return;

    const nextNode = await this.prisma.conceptNode.findFirst({
      where: { order: { gt: currentNode.order } },
      orderBy: { order: 'asc' },
    });
    if (!nextNode) return;

    await this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId: nextNode.id } },
      create: { userId, nodeId: nextNode.id, status: 'IN_PROGRESS' },
      update: { status: 'IN_PROGRESS' },
    });
  }

  private async lockNodeAndUnlockPrevious(userId: string, nodeId: string): Promise<string | null> {
    const currentNode = await this.prisma.conceptNode.findUnique({ where: { id: nodeId } });
    if (!currentNode) return null;

    const prevNode = await this.prisma.conceptNode.findFirst({
      where: { order: { lt: currentNode.order } },
      orderBy: { order: 'desc' },
    });

    if (!prevNode) return null;

    // Lock current node
    await this.prisma.nodeProgress.update({
      where: { userId_nodeId: { userId, nodeId } },
      data: { status: 'LOCKED', attemptsCount: 0 },
    });

    // Make previous node in progress
    await this.prisma.nodeProgress.update({
      where: { userId_nodeId: { userId, nodeId: prevNode.id } },
      data: { status: 'IN_PROGRESS' },
    });

    return prevNode.id;
  }
}
