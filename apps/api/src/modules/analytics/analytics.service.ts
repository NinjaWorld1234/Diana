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
    const totalStudents = await this.prisma.user.count({ where: { role: 'STUDENT' } });

    const progressData = await this.prisma.nodeProgress.aggregate({
      _avg: { masteryScore: true, attemptsCount: true },
      where: { status: { not: 'LOCKED' } }
    });

    const problematicNodesRaw = await this.prisma.nodeProgress.groupBy({
      by: ['nodeId'],
      _avg: { masteryScore: true, attemptsCount: true },
      _count: { userId: true },
      orderBy: { _avg: { masteryScore: 'asc' } },
      take: 5
    });

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

    const recentEvents = await this.prisma.analyticsEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, role: true } } }
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
        id: true, name: true, email: true,
        progress: { select: { status: true, masteryScore: true } }
      }
    }).then(users => {
      return users.map(user => {
        const totalNodes = user.progress.length;
        const completedNodes = user.progress.filter(p => p.status === 'COMPLETED').length;
        const overallMastery = totalNodes > 0 
          ? user.progress.reduce((sum, p) => sum + p.masteryScore, 0) / totalNodes 
          : 0;
        return {
          id: user.id, name: user.name, email: user.email,
          completedNodes, overallMastery: Math.round(overallMastery)
        };
      }).sort((a, b) => b.overallMastery - a.overallMastery);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Admin-only comprehensive analytics
  // ═══════════════════════════════════════════════════════════

  /** Platform overview: total users by role, total sessions, total questions answered */
  async getAdminOverview() {
    const [studentCount, teacherCount, adminCount, totalSessions, totalAttempts, totalAiMessages] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.aiSession.count(),
      this.prisma.questionAttempt.count(),
      this.prisma.aiMessage.count({ where: { role: 'user' } }),
    ]);

    // Activity over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentAttempts, recentAiQuestions, recentSessions, activeStudents] = await Promise.all([
      this.prisma.questionAttempt.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.aiMessage.count({ where: { role: 'user', createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.aiSession.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.questionAttempt.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: sevenDaysAgo } },
      }).then(r => r.length),
    ]);

    return {
      users: { students: studentCount, teachers: teacherCount, admins: adminCount, total: studentCount + teacherCount + adminCount },
      totals: { sessions: totalSessions, attempts: totalAttempts, aiQuestions: totalAiMessages },
      lastWeek: { attempts: recentAttempts, aiQuestions: recentAiQuestions, sessions: recentSessions, activeStudents },
    };
  }

  /** All users with role, activity stats */
  async getAdminUsersList() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        _count: {
          select: {
            attempts: true,
            aiSessions: true,
            progress: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each user, get additional stats
    return Promise.all(users.map(async (u) => {
      const completedNodes = await this.prisma.nodeProgress.count({
        where: { userId: u.id, status: 'COMPLETED' }
      });
      const correctAttempts = await this.prisma.questionAttempt.count({
        where: { userId: u.id, isCorrect: true }
      });
      const totalAttempts = u._count.attempts;
      const aiMessageCount = await this.prisma.aiMessage.count({
        where: { role: 'user', session: { userId: u.id } }
      });
      const lastActivity = await this.prisma.questionAttempt.findFirst({
        where: { userId: u.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return {
        id: u.id, name: u.name, email: u.email, role: u.role,
        isActive: u.isActive, createdAt: u.createdAt,
        completedNodes,
        totalAttempts,
        correctAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        aiSessions: u._count.aiSessions,
        aiMessages: aiMessageCount,
        lastActivity: lastActivity?.createdAt || null,
      };
    }));
  }

  /** AI Teacher detailed analytics */
  async getAdminAiStats() {
    // Total sessions & messages
    const [totalSessions, totalQuestions, totalResponses] = await Promise.all([
      this.prisma.aiSession.count(),
      this.prisma.aiMessage.count({ where: { role: 'user' } }),
      this.prisma.aiMessage.count({ where: { role: 'assistant' } }),
    ]);

    // Sessions per day (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dailySessions = await this.prisma.aiSession.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: fourteenDaysAgo } },
      _count: { id: true },
    });

    // Top users by AI usage
    const topAiUsers = await this.prisma.aiSession.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topAiUsersDetails = await Promise.all(topAiUsers.map(async (u) => {
      const user = await this.prisma.user.findUnique({
        where: { id: u.userId },
        select: { name: true, email: true, role: true },
      });
      const messageCount = await this.prisma.aiMessage.count({
        where: { role: 'user', session: { userId: u.userId } },
      });
      return {
        userId: u.userId,
        name: user?.name || 'مجهول',
        email: user?.email || '',
        role: user?.role || 'STUDENT',
        sessions: u._count.id,
        messages: messageCount,
      };
    }));

    // Recent AI questions (last 20)
    const recentQuestions = await this.prisma.aiMessage.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        session: {
          select: {
            userId: true, nodeId: true,
          },
        },
      },
    });

    // Enrich recent questions with user/node names
    const enrichedQuestions = await Promise.all(recentQuestions.map(async (q) => {
      const user = await this.prisma.user.findUnique({ where: { id: q.session.userId }, select: { name: true } });
      let nodeName = 'سؤال عام';
      if (q.session.nodeId) {
        const node = await this.prisma.conceptNode.findUnique({ where: { id: q.session.nodeId }, select: { titleAr: true } });
        nodeName = node?.titleAr || 'سؤال عام';
      }
      return { id: q.id, content: q.content.substring(0, 120), userName: user?.name || 'مجهول', nodeName, createdAt: q.createdAt };
    }));

    // Sessions by node (which topics get most questions)
    const sessionsByNode = await this.prisma.aiSession.groupBy({
      by: ['nodeId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { nodeId: { not: null } },
      take: 11,
    });

    const topTopics = await Promise.all(sessionsByNode.map(async (s) => {
      const node = s.nodeId ? await this.prisma.conceptNode.findUnique({
        where: { id: s.nodeId }, select: { titleAr: true }
      }) : null;
      const msgCount = await this.prisma.aiMessage.count({
        where: { role: 'user', session: { nodeId: s.nodeId } },
      });
      return {
        nodeId: s.nodeId,
        title: node?.titleAr || 'سؤال عام',
        sessions: s._count.id,
        messages: msgCount,
      };
    }));

    // Average messages per session
    const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalQuestions / totalSessions * 10) / 10 : 0;

    return {
      overview: { totalSessions, totalQuestions, totalResponses, avgMessagesPerSession },
      topUsers: topAiUsersDetails,
      topTopics,
      recentQuestions: enrichedQuestions,
    };
  }
}
