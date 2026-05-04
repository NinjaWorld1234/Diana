import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { Beaker, LogIn, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('student@diana.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/map');
    } catch (err: any) {
      setError(err.message || 'خطأ في تسجيل الدخول');
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '20px', left: '20px',
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
          borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all 0.2s', zIndex: 10,
        }}
        aria-label="تبديل الوضع"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '440px', padding: '40px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Beaker size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>تسجيل الدخول</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>ادخل إلى خارطة التعلم التكيفية</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmed@example.com"
              required
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>كلمة المرور</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}
          >
            {isLoading ? 'جارٍ الدخول...' : (
              <>
                <LogIn size={18} />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>إنشاء حساب جديد</Link>
        </p>

        {/* Quick logins */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '12px' }}>حسابات تجريبية</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'طالب', email: 'student@diana.edu', pass: 'student123' },
              { label: 'معلم', email: 'teacher@diana.edu', pass: 'teacher123' },
              { label: 'مدير', email: 'admin@diana.edu', pass: 'admin123' },
            ].map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-ar)', fontSize: '0.85rem',
                }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
