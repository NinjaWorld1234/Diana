import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Map, Brain, Calculator, BarChart3, User, LogOut, Beaker } from 'lucide-react';

import { Users, Gamepad2 } from 'lucide-react';

const mainNavItems = [
  { path: '/map', label: 'الخارطة', icon: Map },
  { path: '/ai-teacher', label: 'المعلم الذكي', icon: Brain },
  { path: '/calculator', label: 'الحاسبات', icon: Calculator },
  { path: '/mini-games', label: 'الألعاب التفاعلية', icon: Gamepad2 },
  { path: '/dashboard', label: 'لوحة التقدم', icon: BarChart3 },
  { path: '/profile', label: 'الملف الشخصي', icon: User },
];

const teacherNavItems = [
  { path: '/teacher/dashboard', label: 'لوحة المعلم', icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--color-bg-secondary)',
        borderLeft: '1px solid var(--color-border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '32px' }}
          onClick={() => navigate('/map')}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Beaker size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>الطاقة في التفاعلات</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>الخارطة التكيفية</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', fontWeight: 500,
                fontSize: '0.95rem', transition: 'all 0.2s',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              })}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}

          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <>
              <div style={{ marginTop: '16px', marginBottom: '8px', padding: '0 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                الإدارة
              </div>
              {teacherNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none', fontWeight: 500,
                    fontSize: '0.95rem', transition: 'all 0.2s',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: isActive ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                  })}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name || 'طالب'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.role === 'STUDENT' ? 'طالب' : user?.role === 'TEACHER' ? 'معلم' : 'مدير'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-ar)',
              fontSize: '0.9rem', transition: 'all 0.2s',
            }}
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
