import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { motion } from 'framer-motion';
import { User, Mail, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, loadProfile } = useAuthStore();

  useEffect(() => { loadProfile(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>
        <span className="gradient-text">الملف الشخصي</span>
      </h1>

      <div className="glass-card" style={{ padding: '32px', maxWidth: '600px' }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: 'white',
          }}>
            {user?.name?.charAt(0) || '?'}
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
            <User size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>الاسم</div>
              <div style={{ fontWeight: 600 }}>{user?.name || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
            <Mail size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>البريد الإلكتروني</div>
              <div style={{ fontWeight: 600 }}>{user?.email || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
            <Shield size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>الدور</div>
              <div style={{ fontWeight: 600 }}>{user?.role === 'STUDENT' ? 'طالب' : user?.role === 'TEACHER' ? 'معلم' : 'مدير'}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
