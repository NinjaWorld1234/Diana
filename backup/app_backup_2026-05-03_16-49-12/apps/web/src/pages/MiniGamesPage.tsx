import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Play, Trophy, Star, AlertCircle, Search } from 'lucide-react';
import { contentApi } from '../lib/api';
import GameModal from '../components/games/GameModal';

const MOCK_GAMES = [
  {
    id: 'game-1',
    titleAr: 'تحدي المسعر الحراري',
    type: 'CALORIMETER',
    node: { titleAr: 'استخدام المعادلة للحرارة في الحسابات' },
    description: 'قم بمحاكاة تجربة المسعر الحراري لحساب الحرارة النوعية لمعادن مختلفة.',
    color: '#3B82F6',
    icon: <Gamepad2 size={32} />
  },
  {
    id: 'game-2',
    titleAr: 'لغز المطعم',
    type: 'RESTAURANT_PUZZLE',
    node: { titleAr: 'القيمة الحرارية للغذاء' },
    description: 'رتب الأطعمة حسب قيمتها الحرارية لتقديم الوجبة الأنسب رياضياً.',
    color: '#10B981',
    icon: <Star size={32} />
  },
  {
    id: 'game-3',
    titleAr: 'سباق الوقود',
    type: 'GAS_VS_WOOD',
    node: { titleAr: 'حرارة الاحتراق والوقود' },
    description: 'قارن بين أنواع الوقود المختلفة واختر الأفضل لتسيير المركبة لأطول مسافة.',
    color: '#F59E0B',
    icon: <Trophy size={32} />
  }
];

export default function MiniGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGame, setActiveGame] = useState<any>(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const dbGames = await contentApi.getMiniGames();
      // If DB has games, use them. Otherwise show premium mock games.
      if (dbGames && dbGames.length > 0) {
        setGames(dbGames.map((g: any) => ({
          ...g,
          color: '#8B5CF6',
          icon: <Gamepad2 size={32} />,
          description: 'لعبة تفاعلية تطبيقية للتدريب على المفاهيم الكيميائية المدروسة.'
        })));
      } else {
        setGames(MOCK_GAMES);
      }
    } catch (err) {
      console.error('Failed to load mini games:', err);
      // Fallback to mock games if offline or fails
      setGames(MOCK_GAMES);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGames = games.filter(g => 
    g.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.node?.titleAr && g.node.titleAr.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', background: 'linear-gradient(to left, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', color: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Gamepad2 size={40} color="var(--color-primary)" />
            الألعاب التفاعلية
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
            طبق ما تعلمته في الكيمياء الحرارية من خلال تحديات تفاعلية مصممة لربط المفاهيم النظرية بالتطبيقات العملية الممتعة.
          </p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="ابحث عن لعبة أو مفهوم..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', 
              padding: '12px 48px 12px 16px', borderRadius: 'var(--radius-full)', 
              color: 'white', fontSize: '1rem', transition: 'all 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <AlertCircle size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>لم يتم العثور على ألعاب</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>حاول استخدام كلمات بحث مختلفة</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              style={{
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Card Header (Gradient Image Placeholder) */}
              <div style={{ 
                height: '140px', 
                background: `linear-gradient(135deg, ${game.color}33, ${game.color}88)`,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: 'white', position: 'relative'
              }}>
                {game.icon}
                <div style={{ 
                  position: 'absolute', bottom: '12px', right: '12px', 
                  background: 'rgba(0,0,0,0.5)', padding: '4px 10px', 
                  borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}>
                  {game.type}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ color: game.color, fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  {game.node?.titleAr || 'مرتبط بوحدة الطاقة'}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{game.titleAr}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>
                  {game.description}
                </p>

                <button 
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: game.color, color: 'white', padding: '12px',
                    borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    boxShadow: `0 4px 14px ${game.color}40`
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onClick={() => setActiveGame(game)}
                >
                  <Play size={18} fill="white" />
                  بدء اللعب
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* The Game Modal Overlay */}
      {activeGame && (
        <GameModal game={activeGame} onClose={() => setActiveGame(null)} />
      )}
    </div>
  );
}
