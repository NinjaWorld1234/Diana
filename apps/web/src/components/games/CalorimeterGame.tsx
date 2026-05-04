import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Flame, RotateCcw, CheckCircle } from 'lucide-react';

const METALS = [
  { id: 'al', name: 'ألومنيوم', c: 0.897, color: '#9CA3AF' },
  { id: 'fe', name: 'حديد', c: 0.450, color: '#6B7280' },
  { id: 'cu', name: 'نحاس', c: 0.385, color: '#B45309' },
];

export default function CalorimeterGame() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedMetal, setSelectedMetal] = useState<any>(null);
  const [metalMass, setMetalMass] = useState<number>(50); // g
  const [waterMass, setWaterMass] = useState<number>(100); // g
  const [initialTemp, setInitialTemp] = useState<number>(20); // C (water)
  const [metalTemp, setMetalTemp] = useState<number>(100); // C (metal)
  const [finalTemp, setFinalTemp] = useState<number | null>(null);
  
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<any>(null);

  const C_WATER = 4.184;

  const simulate = () => {
    // q_water = -q_metal
    // m_w * c_w * (T_f - T_iw) = - m_m * c_m * (T_f - T_im)
    // T_f = (m_w * c_w * T_iw + m_m * c_m * T_im) / (m_w * c_w + m_m * c_m)
    
    if (!selectedMetal) return;
    
    const mw = waterMass;
    const cw = C_WATER;
    const tiw = initialTemp;
    
    const mm = metalMass;
    const cm = selectedMetal.c;
    const tim = metalTemp;
    
    const num = mw * cw * tiw + mm * cm * tim;
    const den = mw * cw + mm * cm;
    const tf = num / den;
    
    setFinalTemp(tf);
    setStep(2); // Show animation/result
  };

  const checkAnswer = () => {
    if (!selectedMetal) return;
    const ans = parseFloat(userAnswer);
    if (isNaN(ans)) return;

    // Allow 5% error margin
    const error = Math.abs(ans - selectedMetal.c) / selectedMetal.c;
    if (error <= 0.05) {
      setFeedback({ correct: true, text: 'ممتاز! حساباتك دقيقة والحرارة النوعية صحيحة.' });
    } else {
      setFeedback({ correct: false, text: `إجابة خاطئة. تأكد من استخدام القانون: q_water = -q_metal` });
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedMetal(null);
    setFinalTemp(null);
    setUserAnswer('');
    setFeedback(null);
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--color-primary)' }}>محاكاة المسعر الحراري</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>احسب الحرارة النوعية للمعدن المجهول من خلال التجربة</p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flex: 1 }}>
        
        {/* Controls / Inputs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--color-bg)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>إعداد التجربة</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اختر المعدن:</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {METALS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMetal(m)}
                      style={{
                        padding: '12px', flex: 1, borderRadius: 'var(--radius-sm)',
                        background: selectedMetal?.id === m.id ? m.color : 'transparent',
                        color: selectedMetal?.id === m.id ? 'white' : 'var(--color-text)',
                        border: `2px solid ${selectedMetal?.id === m.id ? m.color : 'var(--color-border)'}`,
                        cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  <span>كتلة المعدن (g):</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{metalMass} g</span>
                </label>
                <input type="range" min="10" max="100" value={metalMass} onChange={e => setMetalMass(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  <span>كتلة الماء (g):</span>
                  <span style={{ fontWeight: 600, color: '#3B82F6' }}>{waterMass} g</span>
                </label>
                <input type="range" min="50" max="200" value={waterMass} onChange={e => setWaterMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#3B82F6' }} />
              </div>

              <button className="btn-primary" onClick={() => setStep(1)} disabled={!selectedMetal} style={{ marginTop: 'auto' }}>
                متابعة لتسخين المعدن
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>تسخين المعدن</h3>
              
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  <span>درجة حرارة المعدن الابتدائية (°C):</span>
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>{metalTemp} °C</span>
                </label>
                <input type="range" min="50" max="150" value={metalTemp} onChange={e => setMetalTemp(Number(e.target.value))} style={{ width: '100%', accentColor: '#EF4444' }} />
              </div>

              <button className="btn-primary" onClick={simulate} style={{ marginTop: 'auto', background: '#EF4444' }}>
                <Flame size={18} /> إسقاط المعدن في المسعر
              </button>
            </motion.div>
          )}

          {(step === 2 || step === 3) && finalTemp !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>النتائج والحساب</h3>
              
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>درجة الحرارة النهائية للخليط:</span>
                  <span style={{ fontWeight: 600, color: '#10B981', fontSize: '1.1rem' }}>{finalTemp.toFixed(1)} °C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>ΔT للماء:</span>
                  <span>+{(finalTemp - initialTemp).toFixed(1)} °C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>ΔT للمعدن:</span>
                  <span>{(finalTemp - metalTemp).toFixed(1)} °C</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>احسب الحرارة النوعية للمعدن (J/g·°C):</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={userAnswer} 
                    onChange={e => setUserAnswer(e.target.value)} 
                    placeholder="مثال: 0.45"
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                  />
                  <button className="btn-primary" onClick={checkAnswer} disabled={!userAnswer}>
                    تحقق
                  </button>
                </div>
              </div>

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

              <button className="btn-secondary" onClick={reset} style={{ marginTop: 'auto' }}>
                <RotateCcw size={18} /> إعادة التجربة
              </button>
            </motion.div>
          )}
        </div>

        {/* Visualizer */}
        <div style={{ flex: 1, background: '#0F172A', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            <Thermometer size={20} color={finalTemp ? '#10B981' : '#3B82F6'} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {finalTemp ? finalTemp.toFixed(1) : initialTemp.toFixed(1)} °C
            </span>
          </div>

          {/* Calorimeter Container */}
          <div style={{ position: 'relative', width: '200px', height: '250px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px 10px 40px 40px', border: '4px solid #334155', borderTop: 'none', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            
            {/* Water */}
            <motion.div 
              animate={{ height: `${(waterMass / 200) * 80 + 20}%` }}
              style={{ width: '100%', background: 'rgba(59, 130, 246, 0.4)', borderTop: '2px solid rgba(59, 130, 246, 0.8)', position: 'relative' }}
            >
              {/* Metal Block inside water */}
              <AnimatePresence>
                {step >= 2 && selectedMetal && (
                  <motion.div
                    initial={{ y: -300, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.4, duration: 1 }}
                    style={{
                      position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                      width: `${(metalMass / 100) * 40 + 20}px`, height: `${(metalMass / 100) * 40 + 20}px`,
                      background: selectedMetal.color, borderRadius: '4px',
                      boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      {selectedMetal.id.toUpperCase()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>

          {/* Metal Block outside (Step 1) */}
          <AnimatePresence>
            {step === 1 && selectedMetal && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                style={{
                  position: 'absolute', top: '100px', left: '80px',
                  width: `${(metalMass / 100) * 40 + 20}px`, height: `${(metalMass / 100) * 40 + 20}px`,
                  background: selectedMetal.color, borderRadius: '4px',
                  boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.5), 0 0 20px rgba(239, 68, 68, 0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Flame size={24} color="#EF4444" style={{ position: 'absolute', top: '-30px', animation: 'pulse 1s infinite' }} />
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {selectedMetal.id.toUpperCase()}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
