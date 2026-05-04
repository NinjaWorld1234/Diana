import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Beaker, Map, Brain, Calculator, BarChart3, ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../stores/theme.store';

const features = [
  { icon: Map, title: 'خارطة مفاهيمية تفاعلية', desc: '11 عقدة تعليمية مترابطة تأخذك في رحلة تعلم متسلسلة ومنظمة', color: '#3B82F6' },
  { icon: Brain, title: 'معلم ذكي بالذكاء الاصطناعي', desc: 'اسأل أي سؤال عن الوحدة واحصل على إجابة فورية مع مراجع', color: '#8B5CF6' },
  { icon: Calculator, title: 'حاسبات كيميائية متقدمة', desc: '5 أنواع حاسبات مع 3 أنماط: احسب لي، أرشدني، تحقق من إجابتي', color: '#06B6D4' },
  { icon: BarChart3, title: 'لوحة تقدم شخصية', desc: 'تتبع إتقانك في كل مفهوم مع رسوم بيانية تفصيلية', color: '#10B981' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="animated-bg" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Beaker size={22} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>الخارطة التكيفية</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all 0.2s',
            }}
            aria-label="تبديل الوضع"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-secondary landing-btn-secondary" onClick={() => navigate('/login')}>تسجيل الدخول</button>
          <button className="btn-primary landing-btn-primary" onClick={() => navigate('/register')}>إنشاء حساب</button>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)', padding: '8px 20px',
            borderRadius: '50px', marginBottom: '28px', border: '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            <Sparkles size={16} color="#3B82F6" />
            <span style={{ fontSize: '0.9rem', color: '#3B82F6', fontWeight: 600 }}>الصف العاشر — الكيمياء</span>
          </div>

          <h1 className="landing-title">
            <span className="gradient-text">الطاقة في التفاعلات</span>
            <br />الكيميائية
          </h1>

          <p className="landing-subtitle">
            منصة تعليمية تكيفية ذكية تأخذك في رحلة تعلم مخصصة عبر خارطة مفاهيمية تفاعلية،
            مدعومة بمعلم ذكي وحاسبات كيميائية متقدمة
          </p>

          <div className="landing-cta">
            <button className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
              ابدأ التعلم الآن
              <ArrowLeft size={20} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '1.1rem', padding: '14px 34px' }}>
              لديّ حساب
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="landing-features">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              style={{ padding: '28px' }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        <div className="landing-stats-grid">
          {[
            { value: '11', label: 'عقدة مفاهيمية' },
            { value: '100+', label: 'سؤال متنوع' },
            { value: '5', label: 'حاسبة كيميائية' },
            { value: '4', label: 'جداول مرجعية' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
