import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
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
