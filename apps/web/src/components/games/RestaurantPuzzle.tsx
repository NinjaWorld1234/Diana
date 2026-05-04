import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Utensils, CheckCircle, Flame, RotateCcw } from 'lucide-react';

const FOODS = [
  { id: 'f1', name: 'تفاحة', calories: 95, icon: '🍎' },
  { id: 'f2', name: 'قطعة لحم (100g)', calories: 250, icon: '🥩' },
  { id: 'f3', name: 'وجبة سريعة (برجر)', calories: 500, icon: '🍔' },
  { id: 'f4', name: 'شريحة بيتزا', calories: 285, icon: '🍕' },
  { id: 'f5', name: 'سلطة خضراء', calories: 50, icon: '🥗' },
];

export default function RestaurantPuzzle() {
  const [items, setItems] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    // Shuffle
    setItems([...FOODS].sort(() => Math.random() - 0.5));
  }, []);

  const checkAnswer = () => {
    // Correct order: lowest to highest calories (or highest to lowest)
    // Let's say: arrange from lowest calories to highest
    let isCorrect = true;
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].calories > items[i + 1].calories) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setFeedback({ correct: true, text: 'عمل رائع! الترتيب صحيح، فهمك للقيمة الحرارية للغذاء ممتاز.' });
    } else {
      setFeedback({ correct: false, text: 'الترتيب غير صحيح. تذكر أن بعض الأطعمة تحتوي على دهون وكربوهيدرات أكثر مما يعطي قيمة حرارية أعلى.' });
    }
  };

  const reset = () => {
    setItems([...FOODS].sort(() => Math.random() - 0.5));
    setFeedback(null);
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Utensils /> لغز المطعم
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          رتب الأطعمة التالية من <strong style={{color: 'white'}}>الأقل قيمة حرارية</strong> (في الأعلى) إلى <strong style={{color: 'white'}}>الأعلى قيمة حرارية</strong> (في الأسفل).
        </p>
      </div>

      <div style={{ flex: 1, maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Reorder.Group axis="y" values={items} onReorder={feedback ? () => {} : setItems} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((food, index) => (
            <Reorder.Item
              key={food.id}
              value={food}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-secondary)',
                border: '2px solid var(--color-border)',
                cursor: feedback ? 'default' : 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{food.icon}</span>
              <span style={{ flex: 1 }}>{food.name}</span>
              {feedback && feedback.correct && (
                <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                  <Flame size={16} /> {food.calories} kcal
                </span>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
            padding: '16px', borderRadius: 'var(--radius-sm)',
            background: feedback.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.correct ? '#10B981' : '#EF4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              {feedback.correct ? <CheckCircle size={18} /> : <RotateCcw size={18} />}
              {feedback.correct ? 'صحيح!' : 'حاول مرة أخرى'}
            </div>
            <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--color-text)' }}>{feedback.text}</p>
          </motion.div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
          {!feedback || !feedback.correct ? (
            <button className="btn-primary" onClick={checkAnswer} style={{ flex: 1, background: '#10B981' }}>
              تحقق من الترتيب
            </button>
          ) : (
            <button className="btn-secondary" onClick={reset} style={{ flex: 1 }}>
              <RotateCcw size={18} /> العب مرة أخرى
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
