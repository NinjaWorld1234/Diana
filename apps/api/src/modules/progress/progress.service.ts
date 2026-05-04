import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getUserProgress(userId: string) {
    const progress = await this.prisma.nodeProgress.findMany({
      where: { userId },
      include: { node: true, snapshots: { orderBy: { snapshotAt: 'desc' }, take: 10 } },
      orderBy: { node: { order: 'asc' } },
    });

    const totalNodes = await this.prisma.conceptNode.count();
    const completedNodes = progress.filter((p) => p.status === 'COMPLETED').length;
    const overallMastery = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.masteryScore, 0) / totalNodes
      : 0;
    const totalTime = progress.reduce((sum, p) => sum + p.timeSpentSeconds, 0);
    const totalAttempts = progress.reduce((sum, p) => sum + p.attemptsCount, 0);
    const totalHints = progress.reduce((sum, p) => sum + p.hintsCount, 0);

    return {
      completionPercentage: totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0,
      overallMastery,
      totalNodes,
      completedNodes,
      totalTimeSeconds: totalTime,
      totalAttempts,
      totalHints,
      nodes: progress,
    };
  }

  async getNodeProgress(userId: string, nodeId: string) {
    return this.prisma.nodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
      include: { snapshots: { orderBy: { snapshotAt: 'desc' } } },
    });
  }

  async updateTimeSpent(userId: string, nodeId: string, seconds: number) {
    return this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: { userId, nodeId, status: 'IN_PROGRESS', timeSpentSeconds: seconds },
      update: { timeSpentSeconds: { increment: seconds } },
    });
  }

  async useHint(userId: string, nodeId: string) {
    return this.prisma.nodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: { userId, nodeId, status: 'IN_PROGRESS', hintsCount: 1 },
      update: { hintsCount: { increment: 1 } },
    });
  }

  async getAchievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  }
}
