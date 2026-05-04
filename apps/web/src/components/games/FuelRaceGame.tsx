import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Flame, Info, CheckCircle } from 'lucide-react';

const FUELS = [
  { id: 'wood', name: 'الخشب', heatOfCombustion: 15, unit: 'kJ/g', efficiency: 0.4, color: '#8B4513' },
  { id: 'coal', name: 'الفحم الحجري', heatOfCombustion: 24, unit: 'kJ/g', efficiency: 0.6, color: '#333333' },
  { id: 'methane', name: 'الميثان (غاز طبيعي)', heatOfCombustion: 55, unit: 'kJ/g', efficiency: 0.85, color: '#3B82F6' },
  { id: 'hydrogen', name: 'الهيدروجين', heatOfCombustion: 142, unit: 'kJ/g', efficiency: 0.95, color: '#10B981' },
];

export default function FuelRaceGame() {
  const [selectedFuel, setSelectedFuel] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);

  const startRace = () => {
    if (!selectedFuel) return;
    setIsRacing(true);
    setRaceFinished(false);

    setTimeout(() => {
      setIsRacing(false);
      setRaceFinished(true);
    }, 2500); // Animation duration
  };

  const getDistance = (fuel: any) => {
    // Relative distance based on heat of combustion
    const maxHeat = 142;
    return (fuel.heatOfCombustion / maxHeat) * 100; // Percentage
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Flame /> سباق الوقود
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          اختر الوقود الأفضل لتسيير المركبة لأطول مسافة ممكنة باستخدام 1 جرام فقط من الوقود.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flex: 1 }}>
        
        {/* Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>1. اختيار الوقود</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FUELS.map(f => (
              <button
                key={f.id}
                onClick={() => { setSelectedFuel(f); setRaceFinished(false); }}
                disabled={isRacing}
                style={{
                  padding: '16px', borderRadius: 'var(--radius-sm)',
                  background: selectedFuel?.id === f.id ? `${f.color}22` : 'transparent',
                  border: `2px solid ${selectedFuel?.id === f.id ? f.color : 'var(--color-border)'}`,
                  color: 'white', textAlign: 'right', cursor: isRacing ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{f.name}</span>
                {raceFinished && selectedFuel?.id === f.id && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {f.heatOfCombustion} {f.unit}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button 
            className="btn-primary" 
            onClick={startRace} 
            disabled={!selectedFuel || isRacing} 
            style={{ marginTop: 'auto', background: '#F59E0B' }}
          >
            {isRacing ? 'جاري السباق...' : 'ابدأ السباق!'}
          </button>
        </div>

        {/* Track Area */}
        <div style={{ flex: 2, background: '#1E293B', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px dashed var(--color-border)' }}>
            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={20} /> مسار السباق
            </h3>
          </div>

          <div style={{ flex: 1, position: 'relative', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* The Track */}
            <div style={{ position: 'relative', height: '60px', background: '#334155', borderRadius: '30px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              {/* Start Line */}
              <div style={{ width: '4px', height: '100%', background: 'white', position: 'absolute', left: '60px' }} />
              {/* Finish Line */}
              <div style={{ width: '10px', height: '100%', background: 'repeating-linear-gradient(45deg, white, white 10px, black 10px, black 20px)', position: 'absolute', right: '40px' }} />
              
              <AnimatePresence>
                {selectedFuel && (
                  <motion.div
                    initial={{ left: '10px' }}
                    animate={isRacing || raceFinished ? { left: `calc(${getDistance(selectedFuel)}% - 60px)` } : { left: '10px' }}
                    transition={{ duration: isRacing ? 2.5 : 0.5, ease: "easeOut" }}
                    style={{ position: 'absolute', zIndex: 10 }}
                  >
                    <div style={{ background: selectedFuel.color, padding: '12px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Car size={24} color="white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Panel */}
            <AnimatePresence>
              {raceFinished && selectedFuel && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    {selectedFuel.id === 'hydrogen' ? (
                      <CheckCircle size={32} color="#10B981" style={{ flexShrink: 0 }} />
                    ) : (
                      <Info size={32} color="#3B82F6" style={{ flexShrink: 0 }} />
                    )}
                    <div>
                      <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>النتيجة</h4>
                      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                        الوقود المختار: <strong>{selectedFuel.name}</strong><br />
                        حرارة الاحتراق: <strong>{selectedFuel.heatOfCombustion} {selectedFuel.unit}</strong>
                      </p>
                      
                      {selectedFuel.id === 'hydrogen' ? (
                        <p style={{ color: '#10B981', fontWeight: 600 }}>أحسنت! الهيدروجين يمتلك أعلى حرارة احتراق (142 kJ/g) مما يجعله الوقود الأكفأ والأكثر إنتاجاً للطاقة.</p>
                      ) : (
                        <p style={{ color: '#F59E0B' }}>هناك وقود آخر يعطي طاقة أكبر لكل جرام! تذكر أن حرارة الاحتراق العالية تعني مسافة أطول.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
}
