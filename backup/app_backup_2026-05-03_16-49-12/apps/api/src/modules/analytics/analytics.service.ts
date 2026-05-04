import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(userId: string | null, eventType: string, payload?: any) {
    return this.prisma.analyticsEvent.create({
      data: { userId, eventType, payloadJson: payload },
    });
  }

  async logAudit(userId: string | null, action: string, entityType: string, entityId?: string, details?: any) {
    return this.prisma.auditLog.create({
      data: { userId, action, entityType, entityId, detailsJson: details },
    });
  }

  async getTeacherDashboardStats() {
    // 1. Total Students
    const totalStudents = await this.prisma.user.count({ where: { role: 'STUDENT' } });

    // 2. Average Mastery across all students and all completed/in-progress nodes
    const progressData = await this.prisma.nodeProgress.aggregate({
      _avg: {
        masteryScore: true,
        attemptsCount: true,
      },
      where: {
        status: { not: 'LOCKED' }
      }
    });

    // 3. Problematic Nodes (Nodes with highest average attempts and lowest scores)
    const problematicNodesRaw = await this.prisma.nodeProgress.groupBy({
      by: ['nodeId'],
      _avg: {
        masteryScore: true,
        attemptsCount: true,
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _avg: {
          masteryScore: 'asc'
        }
      },
      take: 5
    });

    // Fetch node details for problematic nodes
    const problematicNodes = await Promise.all(problematicNodesRaw.map(async (p) => {
      const node = await this.prisma.conceptNode.findUnique({ where: { id: p.nodeId }, select: { titleAr: true } });
      return {
        nodeId: p.nodeId,
        titleAr: node?.titleAr || 'Unknown',
        avgMastery: p._avg.masteryScore,
        avgAttempts: p._avg.attemptsCount,
        studentCount: p._count.userId
      };
    }));

    // 4. Recent Activity (Audit logs & Analytics events)
    const recentEvents = await this.prisma.analyticsEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    return {
      totalStudents,
      averageMastery: progressData._avg.masteryScore || 0,
      averageAttempts: progressData._avg.attemptsCount || 0,
      problematicNodes,
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        eventType: e.eventType,
        userName: e.user?.name || 'مجهول',
        time: e.createdAt
      }))
    };
  }

  async getClassProgressList() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        progress: {
          select: {
            status: true,
            masteryScore: true,
          }
        }
      }
    }).then(users => {
      // Calculate derived stats for each student
      return users.map(user => {
        const totalNodes = user.progress.length;
        const completedNodes = user.progress.filter(p => p.status === 'COMPLETED').length;
        const overallMastery = totalNodes > 0 
          ? user.progress.reduce((sum, p) => sum + p.masteryScore, 0) / totalNodes 
          : 0;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          completedNodes,
          overallMastery: Math.round(overallMastery)
        };
      }).sort((a, b) => b.overallMastery - a.overallMastery); // High to low
    });
  }
}
