import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Beaker, Map, Brain, Calculator, BarChart3, ArrowLeft, Sparkles } from 'lucide-react';

const features = [
  { icon: Map, title: 'خارطة مفاهيمية تفاعلية', desc: '11 عقدة تعليمية مترابطة تأخذك في رحلة تعلم متسلسلة ومنظمة', color: '#3B82F6' },
  { icon: Brain, title: 'معلم ذكي بالذكاء الاصطناعي', desc: 'اسأل أي سؤال عن الوحدة واحصل على إجابة فورية مع مراجع', color: '#8B5CF6' },
  { icon: Calculator, title: 'حاسبات كيميائية متقدمة', desc: '5 أنواع حاسبات مع 3 أنماط: احسب لي، أرشدني، تحقق من إجابتي', color: '#06B6D4' },
  { icon: BarChart3, title: 'لوحة تقدم شخصية', desc: 'تتبع إتقانك في كل مفهوم مع رسوم بيانية تفصيلية', color: '#10B981' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="animated-bg" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
      }}>
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate('/login')}>تسجيل الدخول</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>إنشاء حساب</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 40px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
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

          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '20px' }}>
            <span className="gradient-text">الطاقة في التفاعلات</span>
            <br />الكيميائية
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '40px', lineHeight: 1.8 }}>
            منصة تعليمية تكيفية ذكية تأخذك في رحلة تعلم مخصصة عبر خارطة مفاهيمية تفاعلية،
            مدعومة بمعلم ذكي وحاسبات كيميائية متقدمة
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
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
      <section style={{ padding: '40px 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
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
      <section style={{
        padding: '40px', borderTop: '1px solid var(--color-border)',
        background: 'rgba(15, 23, 42, 0.5)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap',
        }}>
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
