import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { progressApi, adaptiveApi } from '../lib/api';
import { BarChart3, Clock, HelpCircle, Brain, Target, TrendingUp, Award, Zap, BookOpen, CheckCircle2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  // Persist session start time so it survives page navigations
  const sessionStart = useMemo(() => {
    const stored = sessionStorage.getItem('diana_session_start');
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    sessionStorage.setItem('diana_session_start', String(now));
    return now;
  }, []);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sessionSeconds = Math.floor((now - sessionStart) / 1000);

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressApi.getUserProgress(),
  });

  const { data: masteryMap } = useQuery({
    queryKey: ['mastery-map'],
    queryFn: () => adaptiveApi.getMasteryMap(),
  });

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="pulse-glow" style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--color-primary)' }} />
    </div>;
  }

  const completionPct = progress?.completionPercentage || 0;
  const masteryPct = Math.round(progress?.overallMastery || 0);
  const totalAttempts = progress?.totalAttempts || 0;
  const savedSeconds = progress?.totalTimeSeconds || 0;
  const liveTotal = savedSeconds + sessionSeconds;
  const totalHints = progress?.totalHints || 0;
  const completedNodes = progress?.completedNodes || 0;
  const totalNodes = progress?.totalNodes || 0;

  const radarData = masteryMap?.filter((n: any) => n.status !== 'LOCKED').map((n: any) => ({
    subject: n.titleAr.substring(0, 15),
    فهم: n.understandingScore,
    تطبيق: n.applicationScore,
    استدلال: n.reasoningScore,
  })) || [];

  const barData = masteryMap?.map((n: any) => ({
    name: n.titleAr.substring(0, 12),
    إتقان: Math.round(n.masteryScore),
    محاولات: n.attemptsCount,
  })) || [];

  const circumference = 2 * Math.PI * 54;

  // Helper for the ring — uses CSS transition, not framer-motion, to avoid re-animation on every tick
  const ProgressRing = ({ pct, color, label, size = 130 }: { pct: number; color: string; label: string; size?: number }) => {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" opacity={0.4} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: size > 140 ? '2rem' : '1.5rem', fontWeight: 800, color }}>{Math.round(pct)}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            <span className="gradient-text">لوحة التقدم</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>تتبع مسيرتك التعليمية في الكيمياء الحرارية</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-secondary)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <BookOpen size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{completedNodes} / {totalNodes} عقد مكتملة</span>
        </div>
      </div>

      {/* ─── Hero Section: 2 Rings + Key Stats ─── */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>

          {/* Completion Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ProgressRing pct={completionPct} color="#3B82F6" label="الإنجاز" size={160} />
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '120px', background: 'var(--color-border)', flexShrink: 0 }} />

          {/* Mastery Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ProgressRing pct={masteryPct} color="#10B981" label="الإتقان" size={160} />
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '120px', background: 'var(--color-border)', flexShrink: 0 }} />

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            {[
              { icon: Zap, label: 'المحاولات', value: totalAttempts, color: '#8B5CF6', isTimer: false },
              { icon: Clock, label: 'الوقت', value: formatTime(liveTotal), color: '#F59E0B', isTimer: true },
              { icon: Brain, label: 'التلميحات', value: totalHints, color: '#EF4444', isTimer: false },
              { icon: Award, label: 'الترتيب', value: masteryPct >= 80 ? 'متفوق' : masteryPct >= 50 ? 'جيد' : 'مبتدئ', color: '#06B6D4', isTimer: false },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{ background: `${s.color}15`, padding: '10px', borderRadius: '12px', display: 'flex' }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, fontFamily: (s as any).isTimer ? 'monospace' : undefined, letterSpacing: (s as any).isTimer ? '1px' : undefined }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Radar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--color-primary)" /> مستويات الإتقان
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-muted)', fontSize: '0.7rem' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)' }} />
                <Radar name="فهم" dataKey="فهم" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="تطبيق" dataKey="تطبيق" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="استدلال" dataKey="استدلال" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              أكمل بعض العقد لعرض مخطط الإتقان
            </div>
          )}
          {radarData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px' }}>
              {[{ label: 'فهم', color: '#3B82F6' }, { label: 'تطبيق', color: '#8B5CF6' }, { label: 'استدلال', color: '#F59E0B' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--color-primary)" /> إتقان كل عقدة
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.7rem' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'var(--font-ar)' }}
                  formatter={(value: any) => [`${value}%`, 'الإتقان']}
                />
                <Bar dataKey="إتقان" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              لا توجد بيانات بعد
            </div>
          )}
        </div>
      </div>

      {/* ─── Node Progress Cards ─── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--color-primary)" /> تفاصيل التقدم في كل عقدة
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {masteryMap?.map((n: any, i: number) => {
            const isCompleted = n.status === 'COMPLETED';
            const isLocked = n.status === 'LOCKED';
            const mastery = Math.round(n.masteryScore);
            const statusColor = isCompleted ? '#10B981' : n.status === 'IN_PROGRESS' ? '#3B82F6' : '#475569';
            const statusLabel = isCompleted ? 'مكتمل' : n.status === 'IN_PROGRESS' ? 'قيد التقدم' : 'مقفل';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                  background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isCompleted ? '#10B98130' : 'var(--color-border)'}`,
                  opacity: isLocked ? 0.45 : 1,
                }}
              >
                {/* Mini Ring */}
                <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                  <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={24} cy={24} r={18} fill="none" stroke="var(--color-border)" strokeWidth="4" opacity={0.3} />
                    <circle
                      cx={24} cy={24} r={18} fill="none" stroke={statusColor} strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - mastery / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: statusColor }}>
                    {mastery}%
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.titleAr}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>{n.attemptsCount || 0} محاولة</span>
                    <span>•</span>
                    <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                </div>

                {/* Check icon for completed */}
                {isCompleted && <CheckCircle2 size={20} color="#10B981" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
