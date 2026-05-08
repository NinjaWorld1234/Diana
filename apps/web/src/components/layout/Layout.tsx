import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import { useQuery } from '@tanstack/react-query';
import { adaptiveApi } from '../../lib/api';
import { Map, Brain, Calculator, BarChart3, User, LogOut, Beaker, Gamepad2, Sun, Moon, Shield, Menu, X } from 'lucide-react';

const baseNavItems = [
  { path: '/ai-teacher', label: 'المعلم الذكي', icon: Brain },
  { path: '/calculator', label: 'الحاسبات', icon: Calculator },
  { path: '/mini-games', label: 'الألعاب التفاعلية', icon: Gamepad2 },
  { path: '/dashboard', label: 'لوحة التقدم', icon: BarChart3 },
  { path: '/profile', label: 'الملف الشخصي', icon: User },
];

const adminNavItems = [
  { path: '/teacher/dashboard', label: 'لوحة المدير', icon: Shield },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if student has any progress to decide if map should be shown
  const { data: masteryMap } = useQuery({
    queryKey: ['mastery-map-nav'],
    queryFn: () => adaptiveApi.getMasteryMap(),
    enabled: !!user,
    staleTime: 60000,
  });

  const isPrivileged = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const hasProgress = isPrivileged || (masteryMap?.some((n: any) => n.status === 'COMPLETED' || n.status === 'IN_PROGRESS'));

  // Show map link only if user has progress or is teacher/admin
  const mainNavItems = hasProgress
    ? [{ path: '/map', label: 'الخارطة', icon: Map }, ...baseNavItems]
    : baseNavItems;

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout-wrapper">
      {/* ── Mobile Top Bar ── */}
      <header className="mobile-topbar">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => handleNavClick('/map')}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Beaker size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>ديانا</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '8px', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text)',
          }}
          aria-label="القائمة"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop) + Slide-in Menu (Mobile) ── */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar--open' : ''}`}>
        {/* Logo (Desktop only, hidden on mobile since topbar has it) */}
        <div
          className="sidebar-logo"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '32px' }}
          onClick={() => handleNavClick('/map')}
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
              onClick={() => setMobileMenuOpen(false)}
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
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none', fontWeight: 500,
                    fontSize: '0.95rem', transition: 'all 0.2s',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  })}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Theme Toggle + User Info + Logout */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          {/* Theme Toggle */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', marginBottom: '12px',
              background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
            </div>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="تبديل الوضع"
            >
              <div className="theme-toggle-knob">
                {theme === 'dark' ? <Moon size={12} color="white" /> : <Sun size={12} color="white" />}
              </div>
            </button>
          </div>

          {/* User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'طالب'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.role === 'STUDENT' ? 'طالب' : user?.role === 'TEACHER' ? 'معلم' : 'مدير'}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); setMobileMenuOpen(false); }}
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
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
