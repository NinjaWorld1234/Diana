import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Award, AlertTriangle, Activity, 
  Search, BookOpen, Clock
} from 'lucide-react';
import { analyticsApi } from '../lib/api';

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [classProgress, setClassProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, currentProgress] = await Promise.all([
        analyticsApi.getTeacherStats(),
        analyticsApi.getClassProgressList()
      ]);
      setStats(statsData);
      setClassProgress(currentProgress);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات اللوحة');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = classProgress.filter(
    s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '12px' }}>
        <AlertTriangle size={24} style={{ marginBottom: '12px' }} />
        <h3>خطأ</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          لوحة تحكم المعلم
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          نظرة شاملة على أداء الفصل وإحصائيات الطلاب
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {[
          { label: 'إجمالي الطلاب', value: stats?.totalStudents || 0, icon: Users, color: 'var(--color-primary)' },
          { label: 'متوسط الإتقان', value: `${(stats?.averageMastery || 0).toFixed(1)}%`, icon: Award, color: 'var(--color-success)' },
          { label: 'متوسط المحاولات', value: (stats?.averageAttempts || 0).toFixed(1), icon: Activity, color: 'var(--color-warning)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: 'var(--color-bg-secondary)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        
        {/* Class Progress Table */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--color-primary)" />
              قائمة الطلاب
            </h2>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="ابحث عن طالب..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ 
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)', 
                  padding: '8px 36px 8px 12px', borderRadius: 'var(--radius-md)', 
                  color: 'white', fontSize: '0.9rem', width: '250px' 
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '12px' }}>الطالب</th>
                  <th style={{ padding: '12px' }}>العقد المنجزة</th>
                  <th style={{ padding: '12px' }}>نسبة الإتقان</th>
                  <th style={{ padding: '12px' }}>مستوى الأداء</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, i) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{student.email}</div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {student.completedNodes} عقدة
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${student.overallMastery}%`, background: student.overallMastery >= 80 ? 'var(--color-success)' : student.overallMastery >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{student.overallMastery}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      {student.overallMastery >= 80 ? '🟢 متفوق' : student.overallMastery >= 50 ? '🟡 متوسط' : '🔴 يحتاج دعم'}
                    </td>
                  </motion.tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>لا يوجد نتائج</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Problematic Nodes */}
          <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--color-warning)" />
              عقد مفاهيمية تحتاج دعم
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stats?.problematicNodes?.map((node: any) => (
                <div key={node.nodeId} style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>{node.titleAr}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--color-danger)' }}>معدل الإتقان: {node.avgMastery.toFixed(1)}%</div>
                    <div style={{ color: 'var(--color-warning)' }}>متوسط المحاولات: {node.avgAttempts.toFixed(1)}</div>
                  </div>
                </div>
              ))}
              {(!stats?.problematicNodes || stats.problematicNodes.length === 0) && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>لا توجد عقد ذات مستوى منخفض حالياً.</p>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-accent)" />
              أحدث النشاطات
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.recentEvents?.map((event: any) => (
                <div key={event.id} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', marginTop: '6px' }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'white' }}>{event.userName}</span> 
                    <span style={{ color: 'var(--color-text-muted)', marginRight: '4px' }}>
                      قام بـ {event.eventType.replace('_', ' ')}
                    </span>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {new Date(event.time).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>لا توجد نشاطات مسجلة.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
