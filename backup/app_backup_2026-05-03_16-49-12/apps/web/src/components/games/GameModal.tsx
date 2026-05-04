import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle } from 'lucide-react';
import CalorimeterGame from './CalorimeterGame';
import RestaurantPuzzle from './RestaurantPuzzle';
import FuelRaceGame from './FuelRaceGame';

interface GameModalProps {
  game: any;
  onClose: () => void;
}

export default function GameModal({ game, onClose }: GameModalProps) {
  if (!game) return null;

  const renderGameContent = () => {
    switch (game.type) {
      case 'CALORIMETER':
        return <CalorimeterGame />;
      case 'RESTAURANT_PUZZLE':
        return <RestaurantPuzzle />;
      case 'GAS_VS_WOOD':
        return <FuelRaceGame />;
      default:
        // Fallback for an undefined game
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <PlayCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto 20px', opacity: 0.5 }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>قريباً...</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
              هذه اللعبة قيد التطوير حالياً، عُد لاحقاً!
            </p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden' // prevent body scroll effectively
        }}
      >
        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '50%',
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 10, textAlign: 'right' }}>
          <div style={{ color: game.color || 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
            {game.node?.titleAr || 'لعبة المراجعة'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'white' }}>
            {game.titleAr}
          </h2>
        </div>

        <motion.div
          initial={{ y: 50, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            width: '100%', maxWidth: '1100px', height: '80vh',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', position: 'relative'
          }}
        >
          {/* Game Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {renderGameContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
