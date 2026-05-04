import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, RotateCcw } from 'lucide-react';

const FOODS = [
  { id: 'burger', name: 'برجر', calories: 500, emoji: '🍔' },
  { id: 'pizza', name: 'شريحة بيتزا', calories: 285, emoji: '🍕' },
  { id: 'apple', name: 'تفاحة', calories: 95, emoji: '🍎' },
  { id: 'icecream', name: 'آيس كريم', calories: 200, emoji: '🍦' },
];

const ACTIVITIES = [
  { id: 'run', name: 'الجري', rate: 10, icon: '🏃‍♂️', color: '#EF4444' }, // 10 kcal/min
  { id: 'swim', name: 'السباحة', rate: 8, icon: '🏊‍♂️', color: '#3B82F6' },  // 8 kcal/min
  { id: 'cycle', name: 'ركوب الدراجة', rate: 7, icon: '🚴‍♂️', color: '#10B981' }, // 7 kcal/min
  { id: 'walk', name: 'المشي', rate: 4, icon: '🚶‍♂️', color: '#F59E0B' },   // 4 kcal/min
];

export default function CaloriesBurnGame() {
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [duration, setDuration] = useState<number>(10); // minutes
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    // Pick a random food initially
    setSelectedFood(FOODS[Math.floor(Math.random() * FOODS.length)]);
  }, []);

  const burnedCalories = selectedActivity ? selectedActivity.rate * duration : 0;
  
  const checkAnswer = () => {
    if (!selectedActivity || !selectedFood) return;
    
    setIsSimulating(true);
    setFeedback(null);
    
    setTimeout(() => {
      setIsSimulating(false);
      
      const diff = Math.abs(burnedCalories - selectedFood.calories);
      // Allow 5% margin or within 10 calories
      if (diff <= 10 || diff / selectedFood.calories <= 0.05) {
        setFeedback({ correct: true, text: 'ممتاز! لقد قمت بحرق السعرات الحرارية بدقة.' });
      } else if (burnedCalories < selectedFood.calories) {
        setFeedback({ correct: false, text: `تحتاج إلى حرق المزيد! ينقصك حوالي ${Math.round(selectedFood.calories - burnedCalories)} سعرة.` });
      } else {
        setFeedback({ correct: false, text: `لقد حرقت سعرات أكثر من المطلوب بكثير! لقد حرقت ${Math.round(burnedCalories - selectedFood.calories)} سعرة إضافية.` });
      }
    }, 1500);
  };

  const reset = () => {
    setSelectedFood(FOODS[Math.floor(Math.random() * FOODS.length)]);
    setSelectedActivity(null);
    setDuration(10);
    setFeedback(null);
  };

  if (!selectedFood) return null;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Flame /> تحدي حرق السعرات
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          اختر نشاطاً رياضياً وحدد المدة الزمنية لحرق السعرات الحرارية الموجودة في الوجبة بدقة.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flex: 1, flexDirection: 'row-reverse' }}>
        
        {/* Visualizer */}
        <div style={{ flex: 1, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          
          <div style={{ fontSize: '5rem', marginBottom: '16px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}>
            {selectedFood.emoji}
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedFood.name}</h3>
          <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.2rem', marginTop: '8px' }}>
            {selectedFood.calories} kcal
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '30px', background: 'var(--color-bg)', borderRadius: '15px', marginTop: '40px', border: '2px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (burnedCalories / selectedFood.calories) * 100)}%` }}
              transition={{ duration: isSimulating ? 1.5 : 0.3, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: burnedCalories > selectedFood.calories + 10 ? '#EF4444' : '#10B981', // Red if overburned, green if close
              }}
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            السعرات المحروقة: <strong style={{ color: 'white' }}>{isSimulating ? '...' : burnedCalories}</strong> kcal
          </div>

        </div>

        {/* Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Activity Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>1. اختر النشاط الرياضي:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ACTIVITIES.map(act => (
                <button
                  key={act.id}
                  onClick={() => { setSelectedActivity(act); setFeedback(null); }}
                  disabled={isSimulating}
                  style={{
                    padding: '16px', borderRadius: 'var(--radius-sm)',
                    background: selectedActivity?.id === act.id ? `${act.color}22` : 'var(--color-bg-secondary)',
                    border: `2px solid ${selectedActivity?.id === act.id ? act.color : 'var(--color-border)'}`,
                    color: selectedActivity?.id === act.id ? 'white' : 'var(--color-text)', 
                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{act.icon}</span>
                  <span style={{ fontWeight: 600 }}>{act.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 600 }}>
              <span>2. حدد المدة (بالدقائق):</span>
              <span style={{ color: 'var(--color-primary)' }}>{duration} min</span>
            </label>
            <input 
              type="range" 
              min="5" 
              max="120" 
              step="5"
              value={duration} 
              onChange={e => { setDuration(Number(e.target.value)); setFeedback(null); }} 
              disabled={!selectedActivity || isSimulating}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }} 
            />
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{
                padding: '16px', borderRadius: 'var(--radius-sm)',
                background: feedback.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${feedback.correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: feedback.correct ? '#10B981' : '#EF4444'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  {feedback.correct ? <CheckCircle size={18} /> : <RotateCcw size={18} />}
                  {feedback.correct ? 'نجاح!' : 'النتيجة غير دقيقة'}
                </div>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--color-text)' }}>{feedback.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
            {!feedback || !feedback.correct ? (
              <button 
                className="btn-primary" 
                onClick={checkAnswer} 
                disabled={!selectedActivity || isSimulating}
                style={{ flex: 1 }}
              >
                {isSimulating ? 'جاري الحساب...' : 'احسب السعرات المحروقة'}
              </button>
            ) : (
              <button className="btn-secondary" onClick={reset} style={{ flex: 1 }}>
                <RotateCcw size={18} /> تحدي جديد
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
