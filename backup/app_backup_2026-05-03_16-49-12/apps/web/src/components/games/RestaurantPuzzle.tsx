import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, RefreshCw, AlertTriangle, ChefHat } from 'lucide-react';

const FOOD_ITEMS = [
  { id: 'f1', name: 'شريحة لحم (بروتين مكثف)', carbs: 0, proteins: 25, fats: 15, weight: 150, emoji: '🥩' },
  { id: 'f2', name: 'أرز أبيض (كربوهيدرات)', carbs: 40, proteins: 4, fats: 1, weight: 100, emoji: '🍚' },
  { id: 'f3', name: 'أفوكادو (دهون صحية)', carbs: 9, proteins: 2, fats: 15, weight: 100, emoji: '🥑' },
  { id: 'f4', name: 'حبة تفاح (سكريات خفيفة)', carbs: 14, proteins: 0.3, fats: 0.2, weight: 100, emoji: '🍎' },
  { id: 'f5', name: 'صدور دجاج', carbs: 0, proteins: 31, fats: 3.6, weight: 100, emoji: '🍗' },
  { id: 'f6', name: 'زيت زيتون (ملعقة)', carbs: 0, proteins: 0, fats: 14, weight: 15, emoji: '🍾' }, // Green bottle emoji
];

export default function RestaurantPuzzle() {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const targetCalories = 650; // Random target

  // Calories = Carbs*4 + Protein*4 + Fats*9  (per 100g or per actual weight)
  // Let's assume the macros given are per item's assigned weight to keep math simple.
  
  const calculateTotalCalories = () => {
    return selectedItems.reduce((acc, item) => {
      const c = item.carbs * 4;
      const p = item.proteins * 4;
      const f = item.fats * 9;
      return acc + c + p + f;
    }, 0);
  };

  const currentTotal = calculateTotalCalories();
  const progress = Math.min((currentTotal / targetCalories) * 100, 100);
  
  const isWon = Math.abs(currentTotal - targetCalories) <= 15; // +/- 15 calories tolerance
  const isLost = currentTotal > targetCalories + 50; // went too far above

  const addItem = (item: any) => {
    if (isWon || isLost) return;
    setSelectedItems([...selectedItems, item]);
  };

  const removeItem = (indexToRemove: number) => {
    if (isWon || isLost) return;
    setSelectedItems(selectedItems.filter((_, idx) => idx !== indexToRemove));
  };

  const reset = () => {
    setSelectedItems([]);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: 'rgba(16, 185, 129, 0.1)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '32px' }}>
        
        {/* Left Side: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <ChefHat size={32} color="var(--color-success)" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>لغز المطعم الصحي</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>ركّب الوجبة بدقة.</p>
          </div>
        </div>

        {/* Center: Calorie Progress Bar */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
            <span>السعرات الحالية للطبق:</span>
            <span style={{ color: currentTotal > targetCalories ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              {Math.round(currentTotal)} / {targetCalories} Cal
            </span>
          </div>
          <div style={{ height: '16px', background: 'var(--color-bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <motion.div 
              animate={{ width: `${progress}%` }}
              style={{ height: '100%', background: currentTotal > targetCalories ? 'var(--color-danger)' : isWon ? 'var(--color-success)' : 'var(--color-primary)', transition: 'background 0.3s' }}
            />
          </div>
        </div>

        {/* Right Side: Target */}
        <div style={{ textAlign: 'center', background: 'var(--color-bg)', padding: '12px 32px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--color-success)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>الهدف الدقيق</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{targetCalories}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', display: 'flex', gap: '32px', overflow: 'hidden' }}>
        
        {/* Menu Items (Left) */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '12px', paddingBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>المكونات المتوفرة</h3>
          {FOOD_ITEMS.map((item) => {
            const itemCalories = Math.round((item.carbs * 4) + (item.proteins * 4) + (item.fats * 9));
            return (
              <motion.div 
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addItem(item)}
                style={{
                  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.2s',
                  transformOrigin: 'left center'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ fontSize: '2.5rem' }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>P: {item.proteins}g</span>
                    <span>C: {item.carbs}g</span>
                    <span>F: {item.fats}g</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{itemCalories}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cal</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column Wrapper */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '400px', overflowY: 'auto', paddingRight: '8px' }}>
          
          {/* Plate Card */}
          <div style={{ flex: 1, background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '350px' }}>
          
          <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', flexShrink: 0 }}>طَبَق العميل</div>
          
          <AnimatePresence>
            {selectedItems.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ position: 'absolute', top: '24px', left: '24px', color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', background: 'var(--color-bg-secondary)', padding: '6px 16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', pointerEvents: 'none', zIndex: 10 }}>
                💡 انقر المكون للإزالة
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ 
            width: '260px', height: '260px', flexShrink: 0,
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)',
            borderRadius: '50%', 
            border: '6px solid #f8fafc',
            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.05), inset 0 -15px 30px rgba(100,110,120,0.15), 0 25px 50px rgba(0,0,0,0.8)',
            display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '8px', padding: '32px',
            position: 'relative',
          }}>
            <AnimatePresence>
              {selectedItems.map((item, idx) => (
                <motion.div 
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, scale: 0, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: Math.random() * 40 - 20 }}
                  exit={{ opacity: 0, scale: 0, y: 50 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                  onClick={() => removeItem(idx)}
                  whileHover={{ scale: 1.1, filter: 'drop-shadow(8px 12px 15px rgba(255,100,100,0.8))' }}
                  title="انقر للإزالة"
                  style={{ fontSize: '3rem', filter: 'drop-shadow(8px 12px 10px rgba(0,0,0,0.6))', display: 'inline-block', cursor: 'pointer', zIndex: 10 - idx }}
                >
                  {item.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
            {selectedItems.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>أضف مكونات للطبق</div>
            )}
          </div>
          <AnimatePresence>
            {isWon && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: '16px', background: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(4px)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
                <Check size={24} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>طبق مثالي! ربحت التحدي.</div>
                <button onClick={reset} style={{ marginLeft: '16px', background: 'white', color: 'var(--color-success)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>العب مرة أخرى</button>
              </motion.div>
            )}
            {isLost && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: '16px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(4px)', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}>
                <AlertTriangle size={24} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>السعرات تجاوزت الحد المقبول!</div>
                <button onClick={reset} style={{ marginLeft: '16px', background: 'white', color: 'var(--color-danger)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  <RefreshCw size={16} /> إفراغ الطبق
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      </div>
    </div>
  );
}
