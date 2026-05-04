import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Droplets, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const METALS = [
  { id: 'al', name: 'ألومنيوم', c: 0.897, color: '#94A3B8' },
  { id: 'cu', name: 'نحاس', c: 0.385, color: '#B45309' },
  { id: 'fe', name: 'حديد', c: 0.449, color: '#475569' },
];

const playSizzleSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 2.5; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1200;
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1.5, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
    noiseSource.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseSource.start();
  } catch(e) { console.error('Audio synthesis fail', e); }
};

export default function CalorimeterGame() {
  const [step, setStep] = useState(1);
  const [isSubmerged, setIsSubmerged] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<any>(null);
  
  // Game parameters (randomized slightly on load, but fixed for simplicity here)
  const massMetal = 50; // g
  const initialTempMetal = 100; // C
  const massWater = 100; // g
  const initialTempWater = 25; // C
  const cWater = 4.184; // J/g.C

  const [finalTemp, setFinalTemp] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState<'SUCCESS' | 'FAIL' | null>(null);

  const simulateExperiment = () => {
    if (!selectedMetal) return;
    
    // -q_metal = q_water
    const numerator = (massMetal * selectedMetal.c * initialTempMetal) + (massWater * cWater * initialTempWater);
    const denominator = (massMetal * selectedMetal.c) + (massWater * cWater);
    const Tf = numerator / denominator;
    
    setFinalTemp(Number(Tf.toFixed(1)));
    
    // Switch to animation step immediately
    setStep(1.5);
    setIsSubmerged(false);
    
    // Fall hits water at roughly 1.0s
    setTimeout(() => {
      setIsSubmerged(true);
      playSizzleSound();
    }, 1000);

    // After 2.5s, when animation of dropping and settling is done, go to step 2 (calculations).
    setTimeout(() => setStep(2), 2500);
  };

  const checkAnswer = () => {
    if (!selectedMetal || !finalTemp) return;
    const correctC = selectedMetal.c;
    const userC = parseFloat(userAnswer);
    if (!isNaN(userC) && Math.abs(userC - correctC) <= 0.05) {
      setResult('SUCCESS');
    } else {
      setResult('FAIL');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Simulation Header */}
      <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>تحدي المسعر الحراري</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>استخدم المعطيات الافتراضية لحساب الحرارة النوعية المجهولة.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px', textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={14}/> ماء المسعر</div>
            <div style={{ fontWeight: 600 }}>100 غرام | 25°C</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', display: 'flex', gap: '32px' }}>
        
        {/* Left Column: Interactive Element & Visuals */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          {step === 1 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              <Flame size={48} color="var(--color-danger)" style={{ margin: '0 auto 24px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>اختر عينة معدنية مسخنة إلى 100°C:</h3>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                {METALS.map((metal) => (
                  <button
                    key={metal.id}
                    onClick={() => setSelectedMetal(metal)}
                    style={{
                      width: '80px', height: '80px', borderRadius: '12px',
                      background: `linear-gradient(135deg, ${metal.color}, #000)`,
                      border: selectedMetal?.id === metal.id ? '4px solid var(--color-success)' : '4px solid transparent',
                      color: 'white', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {metal.name}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary"
                disabled={!selectedMetal}
                onClick={simulateExperiment}
              >
                أسقط العينة في المسعر
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', position: 'relative' }}>
              
              {/* Steam Effect rising from the beaker - EXACTLY when submerged */}
              {isSubmerged && (
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '140px', height: '80px', zIndex: 2, pointerEvents: 'none' }}>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`steam-${i}`}
                      initial={{ opacity: 0, y: 0, scale: 0.5, x: 0 }}
                      animate={{ opacity: [0, 0.8, 0], y: -80 - (Math.random() * 40), scale: [0.5, 2, 3], x: (Math.random() - 0.5) * 60 }}
                      transition={{ duration: 2.0 + Math.random(), repeat: Infinity, delay: Math.random() * 0.5, ease: "easeOut" }}
                      style={{
                        position: 'absolute', top: '20px', left: '50%', width: '40px', height: '40px', marginLeft: '-20px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Heat radiating away effect during step 2 */}
              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }} 
                  animate={{ opacity: [0, 0.4, 0], scale: [1, 1.5, 2] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: 'absolute', top: '10%', left: '50%', marginLeft: '-75px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}
                />
              )}

              {/* The Beaker with Water Shaking effect */}
              <motion.div 
                animate={isSubmerged ? { x: [0, -4, 4, -3, 3, -1, 1, 0] } : {}}
                transition={{ duration: 0.6 }} // Precise shake on impact
                style={{ width: '180px', height: '220px', background: 'rgba(59, 130, 246, 0.1)', border: '4px solid var(--color-border)', borderRadius: '12px', borderTop: 'none', margin: '0 auto 24px', position: 'relative', overflow: 'hidden', zIndex: 1 }}
              >
                
                {/* Surface Tension / Ripple Effect */}
                {isSubmerged && (
                  <motion.div 
                    initial={{ scaleX: 0.2, scaleY: 0, opacity: 1 }}
                    animate={{ scaleX: [1, 3, 5], scaleY: [1, 3, 0], opacity: [1, 0.5, 0] }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    style={{ position: 'absolute', top: '35%', left: '50%', width: '30px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', transform: 'translateX(-50%)', zIndex: 11 }}
                  />
                )}

                {/* Water Level Animating up slightly when metal drops */}
                <motion.div 
                  initial={{ height: '50%' }}
                  animate={{ height: step >= 1.5 ? '65%' : '50%' }}
                  transition={{ delay: 1.0, type: 'spring', bounce: 0.6 }}
                  style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(59, 130, 246, 0.6)', borderTop: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}
                >

                  {/* Metal falling animation - Anchored bubbles */}
                  <motion.div 
                    initial={{ y: -300, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 2.2, delay: 0.2 }}
                    style={{ 
                      position: 'absolute', bottom: '15px', left: '50%', marginLeft: '-25px', 
                      width: '50px', height: '50px', borderRadius: '12px', 
                      background: `linear-gradient(135deg, ${selectedMetal?.color}, #000)`,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
                      zIndex: 10
                    }} 
                  >
                    {selectedMetal?.id.toUpperCase()}
                    
                    {/* Bubbles emitting directly from the metal block */}
                    {isSubmerged && [...Array(15)].map((_, i) => (
                      <motion.div
                        key={`metal-bubble-${i}`}
                        initial={{ opacity: 0, y: 0, x: (Math.random() - 0.5) * 40 }}
                        animate={{ opacity: [0, 1, 0], y: -100 - (Math.random() * 50), x: (Math.random() - 0.5) * 80 }}
                        transition={{ duration: 1.0 + Math.random(), repeat: Infinity, delay: Math.random() * 1.5 }}
                        style={{
                          position: 'absolute', top: '10px', left: '50%', width: `${Math.random() * 6 + 4}px`, height: `${Math.random() * 6 + 4}px`,
                          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.6)',
                          pointerEvents: 'none'
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>

              {step === 2 ? (
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                  درجة الحرارة النهائية (الاستقرار): {finalTemp}°C
                </div>
              ) : (
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', animation: 'pulse 1.5s infinite' }}>
                  جاري انتقال الحرارة...
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column: Calculations */}
        <div style={{ width: '400px', padding: '24px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            سجل الحسابات
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>كتلة المسعر (الماء) m₁:</span>
              <span style={{ fontWeight: 600 }}>100 g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>الحرارة النوعية للماء c₁:</span>
              <span style={{ fontWeight: 600 }}>4.184 J/g.°C</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>الحرارة الابتدائية للماء T₁:</span>
              <span style={{ fontWeight: 600 }}>25.0 °C</span>
            </div>
            <hr style={{ borderColor: 'var(--color-border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>كتلة العينة المعدنية m₂:</span>
              <span style={{ fontWeight: 600 }}>50 g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>الحرارة الابتدائية للمعدن T₂:</span>
              <span style={{ fontWeight: 600 }}>100.0 °C</span>
            </div>
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
                <span>الحرارة النهائية T_f:</span>
                <span style={{ fontWeight: 600 }}>{finalTemp} °C</span>
              </motion.div>
            )}
          </div>

          {step === 2 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginTop: 'auto' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--color-accent)' }}>
                أدخل الحرارة النوعية المحسوبة للمعدن (c₂):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  step="0.001"
                  className="input-field" 
                  placeholder="مثال: 0.38" 
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  disabled={result !== null}
                />
                <button className="btn-primary" onClick={checkAnswer} disabled={!userAnswer || result !== null}>
                  تحقق
                </button>
              </div>

              {result === 'SUCCESS' && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} />
                  <span style={{ fontWeight: 600 }}>إجابة صحيحة! أحسنت صنعاً.</span>
                </div>
              )}
              {result === 'FAIL' && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: 600 }}>إجابة خاطئة. تذكر القانون:</span>
                  </div>
                  <div style={{ direction: 'ltr', fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                    - [m₂ × c₂ × (Tf - T₂)] = [m₁ × c₁ × (Tf - T₁)]
                  </div>
                  <button onClick={() => setResult(null)} style={{ background: 'none', border: 'none', color: 'white', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '4px' }}>حاول مرة أخرى</button>
                </div>
              )}

              {/* Reset Game */}
              {(result === 'SUCCESS') && (
                <button 
                  onClick={() => { setStep(1); setSelectedMetal(null); setFinalTemp(null); setUserAnswer(''); setResult(null); }}
                  style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--color-text-muted)', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <RefreshCw size={16} /> العب بتحدي آخر
                </button>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
