import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConceptMapPage from './pages/ConceptMapPage';
import NodePage from './pages/NodePage';
import AiTeacherPage from './pages/AiTeacherPage';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

import TeacherDashboardPage from './pages/TeacherDashboardPage';
import MiniGamesPage from './pages/MiniGamesPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/map" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user, loadProfile } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);

  // Initialize theme on first render
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load profile on app start when token exists but user data is missing (e.g., after page refresh)
  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/map" element={<ConceptMapPage />} />
        <Route path="/node/:nodeId" element={<NodePage />} />
        <Route path="/ai-teacher" element={<AiTeacherPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/mini-games" element={<MiniGamesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Admin/Teacher Routes */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
