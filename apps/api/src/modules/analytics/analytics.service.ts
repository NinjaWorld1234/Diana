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

    const nodeIds = problematicNodesRaw.map(p => p.nodeId);
    const nodes = await this.prisma.conceptNode.findMany({
      where: { id: { in: nodeIds } },
      select: { id: true, titleAr: true }
    });
    const nodesMap = new Map(nodes.map(n => [n.id, n.titleAr]));

    const problematicNodes = problematicNodesRaw.map((p) => {
      return {
        nodeId: p.nodeId,
        titleAr: nodesMap.get(p.nodeId) || 'Unknown',
        avgMastery: p._avg.masteryScore,
        avgAttempts: p._avg.attemptsCount,
        studentCount: p._count.userId
      };
    });

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

  /** All users with role, activity stats - Optimized to resolve N+1 query bug */
  async getAdminUsersList(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const totalCount = await this.prisma.user.count();

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
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

    // Fetch aggregates in parallel to avoid N+1 query loops
    const [completedGroups, correctGroups, sessions, lastActivityGroups] = await Promise.all([
      this.prisma.nodeProgress.groupBy({
        by: ['userId'],
        where: { status: 'COMPLETED' },
        _count: { id: true },
      }),
      this.prisma.questionAttempt.groupBy({
        by: ['userId'],
        where: { isCorrect: true },
        _count: { id: true },
      }),
      this.prisma.aiSession.findMany({
        select: {
          userId: true,
          _count: {
            select: {
              messages: {
                where: { role: 'user' },
              },
            },
          },
        },
      }),
      this.prisma.questionAttempt.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
      }),
    ]);

    // Create lookup maps for fast O(1) in-memory resolution
    const completedNodesMap = new Map<string, number>();
    for (const g of completedGroups) {
      completedNodesMap.set(g.userId, g._count.id);
    }

    const correctAttemptsMap = new Map<string, number>();
    for (const g of correctGroups) {
      correctAttemptsMap.set(g.userId, g._count.id);
    }

    const aiMessagesMap = new Map<string, number>();
    for (const s of sessions) {
      const current = aiMessagesMap.get(s.userId) || 0;
      aiMessagesMap.set(s.userId, current + s._count.messages);
    }

    const lastActivityMap = new Map<string, Date>();
    for (const g of lastActivityGroups) {
      if (g._max.createdAt) {
        lastActivityMap.set(g.userId, g._max.createdAt);
      }
    }

    const data = users.map((u) => {
      const totalAttempts = u._count.attempts;
      const completedNodes = completedNodesMap.get(u.id) || 0;
      const correctAttempts = correctAttemptsMap.get(u.id) || 0;
      const aiMessageCount = aiMessagesMap.get(u.id) || 0;
      const lastActivity = lastActivityMap.get(u.id) || null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        completedNodes,
        totalAttempts,
        correctAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        aiSessions: u._count.aiSessions,
        aiMessages: aiMessageCount,
        lastActivity,
      };
    });

    return {
      data,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    };
  }

  /** AI Teacher detailed analytics */
  async getAdminAiStats() {
    // Total sessions & messages
    const [totalSessions, totalQuestions, totalResponses] = await Promise.all([
      this.prisma.aiSession.count(),
      this.prisma.aiMessage.count({ where: { role: 'user' } }),
      this.prisma.aiMessage.count({ where: { role: 'assistant' } }),
    ]);

    // Sessions per day (last 14 days) - Fix: Group in-memory by date (YYYY-MM-DD) instead of precise timestamp
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const sessionsLast14Days = await this.prisma.aiSession.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });

    const dailySessionsMap = new Map<string, number>();
    for (const s of sessionsLast14Days) {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      dailySessionsMap.set(dateStr, (dailySessionsMap.get(dateStr) || 0) + 1);
    }

    const dailySessions = Array.from(dailySessionsMap.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Top users by AI usage
    const topAiUsers = await this.prisma.aiSession.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const userIds = topAiUsers.map(u => u.userId);
    const usersData = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(usersData.map(u => [u.id, u]));

    const messagesCountRaw = await this.prisma.aiMessage.groupBy({
      by: ['sessionId'],
      where: { role: 'user', session: { userId: { in: userIds } } },
      _count: { id: true }
    });
    // This requires joining session -> user, but since prisma groupBy on relation is limited,
    // we just fetch count directly grouped by user id using a slightly different approach:
    const userMessagesRaw = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        _count: {
          select: { aiSessions: true }
        }
      }
    }); // Just a fallback if needed, but we'll fetch message count using aiSession
    
    // Efficiently get message count per user:
    const sessions = await this.prisma.aiSession.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true, _count: { select: { messages: { where: { role: 'user' } } } } }
    });
    const msgCountMap = new Map();
    for (const s of sessions) {
      msgCountMap.set(s.userId, (msgCountMap.get(s.userId) || 0) + s._count.messages);
    }

    const topAiUsersDetails = topAiUsers.map((u) => {
      const user = userMap.get(u.userId);
      const messageCount = msgCountMap.get(u.userId) || 0;
      return {
        userId: u.userId,
        name: user?.name || 'مجهول',
        email: user?.email || '',
        role: user?.role || 'STUDENT',
        sessions: u._count.id,
        messages: messageCount,
      };
    });

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

    const qUserIds = [...new Set(recentQuestions.map(q => q.session.userId))];
    const qNodeIds = [...new Set(recentQuestions.map(q => q.session.nodeId).filter(Boolean) as string[])];

    const [qUsers, qNodes] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: qUserIds } }, select: { id: true, name: true } }),
      this.prisma.conceptNode.findMany({ where: { id: { in: qNodeIds } }, select: { id: true, titleAr: true } })
    ]);

    const qUserMap = new Map(qUsers.map(u => [u.id, u.name]));
    const qNodeMap = new Map(qNodes.map(n => [n.id, n.titleAr]));

    // Enrich recent questions with user/node names
    const enrichedQuestions = recentQuestions.map((q) => {
      const userName = qUserMap.get(q.session.userId);
      let nodeName = 'سؤال عام';
      if (q.session.nodeId) {
        nodeName = qNodeMap.get(q.session.nodeId) || 'سؤال عام';
      }
      return { id: q.id, content: q.content.substring(0, 120), userName: userName || 'مجهول', nodeName, createdAt: q.createdAt };
    });

    // Sessions by node (which topics get most questions)
    const sessionsByNode = await this.prisma.aiSession.groupBy({
      by: ['nodeId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { nodeId: { not: null } },
      take: 11,
    });

    const tNodeIds = sessionsByNode.map(s => s.nodeId).filter(Boolean) as string[];
    const tNodes = await this.prisma.conceptNode.findMany({
      where: { id: { in: tNodeIds } },
      select: { id: true, titleAr: true }
    });
    const tNodeMap = new Map(tNodes.map(n => [n.id, n.titleAr]));

    const nodeMsgSessions = await this.prisma.aiSession.findMany({
      where: { nodeId: { in: tNodeIds } },
      select: { nodeId: true, _count: { select: { messages: { where: { role: 'user' } } } } }
    });
    const nodeMsgCountMap = new Map();
    for (const s of nodeMsgSessions) {
      if (s.nodeId) {
        nodeMsgCountMap.set(s.nodeId, (nodeMsgCountMap.get(s.nodeId) || 0) + s._count.messages);
      }
    }

    const topTopics = sessionsByNode.map((s) => {
      return {
        nodeId: s.nodeId,
        title: s.nodeId ? tNodeMap.get(s.nodeId) || 'سؤال عام' : 'سؤال عام',
        sessions: s._count.id,
        messages: s.nodeId ? nodeMsgCountMap.get(s.nodeId) || 0 : 0,
      };
    });

    // Average messages per session
    const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalQuestions / totalSessions * 10) / 10 : 0;

    return {
      overview: { totalSessions, totalQuestions, totalResponses, avgMessagesPerSession },
      topUsers: topAiUsersDetails,
      topTopics,
      recentQuestions: enrichedQuestions,
      dailySessions,
    };
  }
}
