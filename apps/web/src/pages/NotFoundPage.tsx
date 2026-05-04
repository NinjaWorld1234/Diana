import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="animated-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
        <div className="gradient-text" style={{ fontSize: '8rem', fontWeight: 900, lineHeight: 1 }}>404</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '12px' }}>الصفحة غير موجودة</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <Home size={18} /> العودة للرئيسية
        </button>
      </motion.div>
    </div>
  );
}
