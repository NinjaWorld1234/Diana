import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Brain, MessageSquare, BookOpen, TrendingUp, Target, Clock, BarChart3 } from 'lucide-react';
import { analyticsApi } from '../../lib/api';

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{
      background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

export function PlatformOverview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { analyticsApi.getAdminOverview().then(setData).catch(() => {}); }, []);
  if (!data) return null;

  return (
    <div>
      <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart3 size={20} color="var(--color-primary)" /> نظرة عامة على المنصة
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <StatCard label="إجمالي الطلاب" value={data.users.students} icon={Users} color="var(--color-primary)" />
        <StatCard label="المعلمون" value={data.users.teachers} icon={Users} color="var(--color-secondary)" />
        <StatCard label="جلسات المعلم الذكي" value={data.totals.sessions} icon={Brain} color="#8B5CF6" />
        <StatCard label="أسئلة للمعلم الذكي" value={data.totals.aiQuestions} icon={MessageSquare} color="var(--color-accent)" />
        <StatCard label="إجابات على الأسئلة" value={data.totals.attempts} icon={Target} color="var(--color-success)" />
        <StatCard label="طلاب نشطون (7 أيام)" value={data.lastWeek.activeStudents} icon={TrendingUp} color="var(--color-warning)"
          sub={`${data.lastWeek.attempts} إجابة · ${data.lastWeek.aiQuestions} سؤال ذكي`} />
      </div>
    </div>
  );
}

export function UsersMonitoring() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  useEffect(() => { analyticsApi.getAdminUsers().then(setUsers).catch(() => {}); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchRole = filter === 'ALL' || u.role === filter;
    return matchSearch && matchRole;
  });

  const roleLabel = (r: string) => r === 'STUDENT' ? 'طالب' : r === 'TEACHER' ? 'معلم' : 'مدير';
  const roleBadge = (r: string) => {
    const colors: any = { STUDENT: 'var(--color-primary)', TEACHER: 'var(--color-secondary)', ADMIN: 'var(--color-warning)' };
    return <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '10px', background: `${colors[r]}15`, color: colors[r], fontWeight: 600 }}>{roleLabel(r)}</span>;
  };

  return (
    <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--color-primary)" /> مراقبة المستخدمين
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>({filtered.length})</span>
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['ALL','STUDENT','TEACHER','ADMIN'].map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-ar)', border: '1px solid var(--color-border)', transition: 'all 0.2s',
              background: filter === r ? 'var(--color-primary)' : 'transparent',
              color: filter === r ? 'white' : 'var(--color-text-secondary)',
            }}>
              {r === 'ALL' ? 'الكل' : roleLabel(r)}
            </button>
          ))}
          <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '6px 12px',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: '0.85rem', width: '160px', fontFamily: 'var(--font-ar)' }} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '10px', textAlign: 'right' }}>المستخدم</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>الدور</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>عقد مكتملة</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>إجابات</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>الدقة</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>جلسات ذكية</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>رسائل ذكية</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>آخر نشاط</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '12px 10px' }}>{roleBadge(u.role)}</td>
                <td style={{ padding: '12px 10px' }}>{u.completedNodes}</td>
                <td style={{ padding: '12px 10px' }}>{u.totalAttempts}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ color: u.accuracy >= 70 ? 'var(--color-success)' : u.accuracy >= 40 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 600 }}>
                    {u.accuracy}%
                  </span>
                </td>
                <td style={{ padding: '12px 10px' }}>{u.aiSessions}</td>
                <td style={{ padding: '12px 10px' }}>{u.aiMessages}</td>
                <td style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString('ar-SA') : '—'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>لا نتائج</div>}
      </div>
    </div>
  );
}

export function AiTeacherMonitoring() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { analyticsApi.getAdminAiStats().then(setData).catch(() => {}); }, []);
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* AI Overview Cards */}
      <div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="var(--color-secondary)" /> إحصائيات المعلم الذكي
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <StatCard label="إجمالي الجلسات" value={data.overview.totalSessions} icon={MessageSquare} color="var(--color-secondary)" />
          <StatCard label="أسئلة الطلاب" value={data.overview.totalQuestions} icon={Users} color="var(--color-primary)" />
          <StatCard label="ردود المعلم" value={data.overview.totalResponses} icon={Brain} color="var(--color-success)" />
          <StatCard label="متوسط الرسائل/جلسة" value={data.overview.avgMessagesPerSession} icon={TrendingUp} color="var(--color-warning)" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top Topics */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--color-accent)" /> أكثر المواضيع سؤالاً
          </h3>
          {data.topTopics.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.88rem' }}>{t.title}</span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <span>{t.sessions} جلسة</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t.messages} رسالة</span>
              </div>
            </div>
          ))}
          {data.topTopics.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>لا توجد بيانات</p>}
        </div>

        {/* Top AI Users */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--color-success)" /> أكثر المستخدمين تفاعلاً
          </h3>
          {data.topUsers.map((u: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{u.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginRight: '8px' }}>{u.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <span>{u.sessions} جلسة</span>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{u.messages} رسالة</span>
              </div>
            </div>
          ))}
          {data.topUsers.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>لا توجد بيانات</p>}
        </div>
      </div>

      {/* Recent AI Questions */}
      <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--color-warning)" /> آخر أسئلة الطلاب للمعلم الذكي
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.recentQuestions.map((q: any) => (
            <div key={q.id} style={{ display: 'flex', gap: '12px', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{q.userName}: </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{q.content}</span>
              </div>
              <div style={{ flexShrink: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--color-secondary)', padding: '1px 8px', borderRadius: '8px' }}>{q.nodeName}</span>
                <span style={{ marginTop: '4px' }}>{new Date(q.createdAt).toLocaleString('ar-SA')}</span>
              </div>
            </div>
          ))}
          {data.recentQuestions.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>لا توجد أسئلة</p>}
        </div>
      </div>
    </div>
  );
}
