import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Play, Car, Zap, RefreshCw } from 'lucide-react';


const FUELS = [
  { id: 'wood', name: 'الخشب', heatOfCombustion: 15, unit: 'MJ/kg', description: 'وقود صلب حيوي يحترق ببطء وتُهدر طاقته في التبخر.', color: '#8B5CF6' },
  { id: 'coal', name: 'الفحم الحجري', heatOfCombustion: 24, unit: 'MJ/kg', description: 'وقود أحفوري صلب ذو طاقة متوسطة لارتفاع نسبة الكربون.', color: '#475569' },
  { id: 'gas', name: 'الغاز الطبيعي (ميثان)', heatOfCombustion: 54, unit: 'MJ/kg', description: 'وقود غازي يحترق بنظافة وطاقته عالية لروابط C-H القوية.', color: '#3B82F6' },
  { id: 'h2', name: 'الهيدروجين السائل', heatOfCombustion: 142, unit: 'MJ/kg', description: 'أعلى طاقة لكل كتلة، يُستخدم في الصواريخ الفضائية.', color: '#10B981' }
];

export default function FuelRaceGame() {
  const [selectedFuel, setSelectedFuel] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [raceComplete, setRaceComplete] = useState(false);

  // The race track parameters
  const trackWidth = 700;
  
  // Benchmark opponent (Say.. Gasoline around 45 MJ/kg)
  const opponentHeat = 45; 
  
  const playSound = (type: 'race' | 'win' | 'lose') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    if (type === 'race') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(40, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(150, ctx.currentTime + 1.5);
      osc1.frequency.linearRampToValueAtTime(80, ctx.currentTime + 3);
      osc2.frequency.setValueAtTime(42, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(155, ctx.currentTime + 1.5);
      osc2.frequency.linearRampToValueAtTime(82, ctx.currentTime + 3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 1.5);
      filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 3);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

      osc1.connect(filter); osc2.connect(filter);
      filter.connect(gain); gain.connect(ctx.destination);
      osc1.start(); osc2.start();
      osc1.stop(ctx.currentTime + 3); osc2.stop(ctx.currentTime + 3);
    } else if (type === 'win') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800; // Crowd roar
      noiseFilter.Q.value = 0.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);

      noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination);
      noise.start();

      // Mix with joyful bells
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i*0.1);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i*0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.1 + 0.6);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i*0.1); osc.stop(ctx.currentTime + i*0.1 + 0.6);
      });
    } else if (type === 'lose') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(500, ctx.currentTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination);
      noise.start();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.6);
    }
  };

  const startRace = () => {
    if (!selectedFuel) return;
    setIsRacing(true);
    setRaceComplete(false);
    
    playSound('race');

    setTimeout(() => {
      setIsRacing(false);
      setRaceComplete(true);
      if (selectedFuel.heatOfCombustion > opponentHeat) {
        playSound('win');
      } else {
        playSound('lose');
      }
    }, 3000); // race duration
  };

  const getDistancePercent = (heat: number) => {
    const highestHeat = Math.max(opponentHeat, selectedFuel?.heatOfCombustion || 0) || 1;
    // The winner reaches ~92% of the track, the loser reaches a proportional fraction.
    return `${(heat / highestHeat) * 92}%`;
  };

  const reset = () => {
    setIsRacing(false);
    setRaceComplete(false);
    setSelectedFuel(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Trophy size={32} color="var(--color-warning)" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>سباق الوقود العظيم</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>اختر الوقود الأنسب للمنافسة وتغلب على سيارة الخصم (تعمل بالبنزين).</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
        
        {/* Race Track */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', position: 'relative', flexShrink: 0 }}>
          
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '48px', width: '4px', background: 'var(--color-success) repeating-linear-gradient(0deg, transparent, transparent 10px, white 10px, white 20px)', zIndex: 1 }} />

          {/* Opponent Track */}
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <div style={{ width: '100px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>سيارة الخصم (بنزين) - {opponentHeat} MJ/kg</div>
            <div style={{ width: '100%', height: '32px', background: '#334155', borderRadius: '16px', position: 'relative', overflow: 'visible' }}>
              <motion.div 
                animate={isRacing || raceComplete ? { right: getDistancePercent(opponentHeat) } : { right: '0%' }}
                transition={{ duration: 2.8, ease: "easeOut" }}
                style={{ position: 'absolute', right: '0%', top: '-14px', fontSize: '2.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
              >
                🚙
              </motion.div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed var(--color-border)', margin: '8px 0' }} />

          {/* Player Track */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>سيارتك ({selectedFuel ? selectedFuel.name : 'لم تختر'})</div>
              {selectedFuel && <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}><Zap size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {selectedFuel.heatOfCombustion} MJ/kg</div>}
            </div>
            
            <div style={{ width: '100%', height: '32px', background: '#334155', borderRadius: '16px', position: 'relative', overflow: 'visible' }}>
              <motion.div 
                animate={isRacing || raceComplete ? { right: getDistancePercent(selectedFuel?.heatOfCombustion || 0) } : { right: '0%' }}
                transition={{ duration: 3, ease: "easeOut" }}
                style={{ position: 'absolute', right: '0%', top: '-14px', fontSize: '2.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
              >
                🏎️
              </motion.div>
            </div>
          </div>

        </div>

        {/* Fuel Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flexShrink: 0 }}>
          {FUELS.map((fuel) => (
            <div 
              key={fuel.id}
              onClick={() => !isRacing && setSelectedFuel(fuel)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'var(--color-bg-card)', padding: '12px', borderRadius: 'var(--radius-md)',
                border: selectedFuel?.id === fuel.id ? `2px solid ${fuel.color}` : '1px solid var(--color-border)',
                cursor: isRacing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                boxShadow: selectedFuel?.id === fuel.id ? `0 0 15px ${fuel.color}30` : 'none',
                opacity: (isRacing || raceComplete) && selectedFuel?.id !== fuel.id ? 0.4 : 1
              }}
            >
              <div style={{ background: `${fuel.color}20`, padding: '8px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                <Flame size={24} color={fuel.color} />
              </div>
              <div style={{ textAlign: 'start' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{fuel.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{fuel.heatOfCombustion} MJ/kg</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar & Results */}
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
          <div style={{ flex: 1, paddingLeft: '24px' }}>
            {!isRacing && !raceComplete && (
               <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                 يجب أن تتفوق سيارتك على طاقة احتراق البنزين <strong style={{color: 'var(--color-warning)'}}>(45 MJ/kg)</strong> للفوز.<br/>
                 اختر الوقود الأنسب للمنافسة واضغط "انطلق"!
               </div>
            )}
            {isRacing && (
               <div style={{ color: 'var(--color-warning)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Flame className="animate-pulse" /> المحركات تشتعل...
               </div>
            )}
            {raceComplete && selectedFuel && selectedFuel.heatOfCombustion > opponentHeat && (
               <div style={{ color: 'var(--color-success)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Trophy /> رائع! فزت بفضل قوة روابط {selectedFuel.name}.
               </div>
            )}
            {raceComplete && selectedFuel && selectedFuel.heatOfCombustion <= opponentHeat && (
               <div style={{ color: 'var(--color-danger)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 💥 طاقة {selectedFuel.name} متواضعة للسباق. ابحث عن روابط هيدروكربونية أكثف!
               </div>
            )}
          </div>
          
          <button 
             onClick={raceComplete ? reset : startRace}
             disabled={!selectedFuel || isRacing}
             className="btn-primary"
             style={{ 
               padding: '16px 40px', fontSize: '1.2rem', borderRadius: '50px', whiteSpace: 'nowrap',
               background: raceComplete ? 'white' : 'var(--color-primary)',
               color: raceComplete ? 'var(--color-bg)' : 'white'
             }}
          >
             {raceComplete ? <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><RefreshCw size={20}/> إعادة السباق</span> : <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Play size={20}/> انطلق</span>}
          </button>
        </div>

      </div>
    </div>
  );
}
