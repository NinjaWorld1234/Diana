import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Award, AlertTriangle, Activity, 
  Search, Clock, Key, Plus, Trash2, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, RefreshCw, Zap, Shield
} from 'lucide-react';
import { analyticsApi, adminApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { PlatformOverview, UsersMonitoring, AiTeacherMonitoring } from '../components/admin/AdminMonitoring';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [stats, setStats] = useState<any>(null);
  const [classProgress, setClassProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // API Keys State (Admin only)
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [keyMessage, setKeyMessage] = useState('');

  useEffect(() => {
    if (!user) return; // Wait until user profile is loaded
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, currentProgress] = await Promise.all([
        analyticsApi.getTeacherStats(),
        analyticsApi.getClassProgressList()
      ]);
      setStats(statsData);
      setClassProgress(currentProgress);

      // Load API keys if admin (use fresh user value)
      if (user?.role === 'ADMIN') {
        await loadApiKeys();
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات اللوحة');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      setKeysLoading(true);
      const keys = await adminApi.getApiKeys();
      setApiKeys(keys);
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyValue.trim()) return;
    try {
      setAddingKey(true);
      setKeyMessage('');
      await adminApi.addApiKey(
        newKeyLabel.trim() || `مفتاح ${apiKeys.length + 1}`,
        newKeyValue.trim(),
        apiKeys.length
      );
      setNewKeyLabel('');
      setNewKeyValue('');
      await loadApiKeys();
      setKeyMessage('✅ تمت إضافة المفتاح بنجاح');
    } catch (err: any) {
      setKeyMessage(`❌ ${err.message}`);
    } finally {
      setAddingKey(false);
    }
  };

  const handleToggleKey = async (id: string, currentActive: boolean) => {
    try {
      await adminApi.updateApiKey(id, { isActive: !currentActive });
      await loadApiKeys();
    } catch (err: any) {
      setKeyMessage(`❌ ${err.message}`);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المفتاح؟')) return;
    try {
      await adminApi.deleteApiKey(id);
      await loadApiKeys();
      setKeyMessage('🗑️ تم حذف المفتاح');
    } catch (err: any) {
      setKeyMessage(`❌ ${err.message}`);
    }
  };

  const handleTestKey = async (id: string) => {
    const keyIndex = apiKeys.findIndex(k => k.id === id) + 1;
    try {
      setTestingKeyId(id);
      setKeyMessage('');
      const result = await adminApi.testApiKey(id);
      if (result.success) {
        setKeyMessage(`✅ المفتاح ${keyIndex} يعمل! الرد: "${result.response}"`);
      } else {
        setKeyMessage(`❌ المفتاح ${keyIndex} — فشل الاختبار: ${result.error}`);
      }
      await loadApiKeys();
    } catch (err: any) {
      setKeyMessage(`❌ ${err.message}`);
    } finally {
      setTestingKeyId(null);
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
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="gradient-text">لوحة المدير</span>
          <Shield size={24} color="var(--color-primary)" />
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          نظرة شاملة على أداء الفصل وإدارة مفاتيح الذكاء الاصطناعي
        </p>
      </div>

      {/* ═══════ API Keys Section (Admin Only) ═══════ */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={22} color="var(--color-warning)" />
            مفاتيح Gemini الذكية
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
              ({apiKeys.length}/10)
            </span>
          </h2>

          {/* Status Message */}
          {keyMessage && (
            <div style={{
              padding: '10px 16px', marginBottom: '16px', borderRadius: 'var(--radius-sm)',
              background: keyMessage.startsWith('✅') || keyMessage.startsWith('🗑️')
                ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${keyMessage.startsWith('✅') || keyMessage.startsWith('🗑️')
                ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.9rem',
            }}>
              {keyMessage}
            </div>
          )}

          {/* Add New Key Form */}
          {apiKeys.length < 10 && (
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
              padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--color-border)',
            }}>
              <input
                type="text"
                placeholder="اسم المفتاح (اختياري)"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                style={{
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)',
                  fontSize: '0.9rem', width: '180px', fontFamily: 'var(--font-ar)',
                }}
              />
              <input
                type="text"
                placeholder="مفتاح API من Google AI Studio"
                value={newKeyValue}
                onChange={e => setNewKeyValue(e.target.value)}
                style={{
                  flex: 1, minWidth: '250px',
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)',
                  fontSize: '0.9rem', fontFamily: 'monospace', direction: 'ltr',
                }}
              />
              <button
                onClick={handleAddKey}
                disabled={addingKey || !newKeyValue.trim()}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.9rem', opacity: (!newKeyValue.trim() || addingKey) ? 0.5 : 1 }}
              >
                <Plus size={16} />
                {addingKey ? 'جارٍ الإضافة...' : 'إضافة مفتاح'}
              </button>
            </div>
          )}

          {/* Keys List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {apiKeys.map((key, i) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                  border: `1px solid ${key.isActive ? (key.lastError ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)') : 'rgba(239, 68, 68, 0.3)'}`,
                  opacity: key.isActive ? 1 : 0.6,
                }}
              >
                {/* Priority Badge */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: key.isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100,100,100,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: key.isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}>
                  {i + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{key.label || `مفتاح ${i + 1}`}</span>
                    {key.isActive ? (
                      key.lastError ? (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '10px' }}>⚠️ خطأ</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>✅ نشط</span>
                      )
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '10px' }}>⏸️ معطّل</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>
                    {key.apiKey}
                  </div>
                  {key.lastError && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                      ⚠️ {key.lastError.substring(0, 80)}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', gap: '16px' }}>
                    <span>استخدام: {key.usageCount} مرة</span>
                    {key.lastUsedAt && <span>آخر استخدام: {new Date(key.lastUsedAt).toLocaleDateString('ar-SA')}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleTestKey(key.id)}
                    disabled={testingKeyId === key.id}
                    style={{
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                      color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.78rem', fontFamily: 'var(--font-ar)',
                    }}
                    title="اختبار المفتاح"
                  >
                    <Zap size={14} className={testingKeyId === key.id ? 'pulse-glow' : ''} />
                    {testingKeyId === key.id ? '...' : 'اختبار'}
                  </button>
                  <button
                    onClick={() => handleToggleKey(key.id, key.isActive)}
                    style={{
                      background: 'transparent', border: '1px solid var(--color-border)',
                      borderRadius: '8px', padding: '6px', cursor: 'pointer',
                      color: key.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center',
                    }}
                    title={key.isActive ? 'إيقاف' : 'تفعيل'}
                  >
                    {key.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px', padding: '6px', cursor: 'pointer',
                      color: 'var(--color-danger)', display: 'flex', alignItems: 'center',
                    }}
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}

            {apiKeys.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)',
                background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-border)',
              }}>
                <Key size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>لا توجد مفاتيح بعد. أضف مفتاح Gemini واحداً على الأقل لتشغيل المعلم الذكي.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  احصل على مفتاح مجاني من <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Google AI Studio</a>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══════ Stats Cards ═══════ */}
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
                  padding: '8px 36px 8px 12px', borderRadius: 'var(--radius-sm)', 
                  color: 'var(--color-text)', fontSize: '0.9rem', width: '250px',
                  fontFamily: 'var(--font-ar)',
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
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{event.userName}</span> 
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

      {/* ═══════ Admin Monitoring Sections ═══════ */}
      {isAdmin && (
        <>
          <PlatformOverview />
          <AiTeacherMonitoring />
          <UsersMonitoring />
        </>
      )}
    </div>
  );
}
