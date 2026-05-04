import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Flame, Utensils, Beaker, Link, Thermometer, Play, RotateCcw, ChevronLeft } from 'lucide-react';

// ─── Reference Data ─────────────────────────
const BOND_ENERGIES: Record<string, number> = {
  'H-H': 436, 'H-F': 567, 'H-Cl': 431, 'H-Br': 366, 'H-I': 298,
  'H-O': 463, 'H-N': 391, 'H-C': 413, 'H-S': 363,
  'C-C': 347, 'C=C': 614, 'C≡C': 839,
  'C-O': 358, 'C=O': 799, 'C-N': 305, 'C=N': 615, 'C≡N': 891,
  'C-F': 485, 'C-Cl': 339, 'C-Br': 276,
  'O=O': 498, 'O-O': 146, 'N≡N': 945, 'N-N': 163, 'N=N': 418,
  'F-F': 159, 'Cl-Cl': 242, 'Br-Br': 193, 'I-I': 151,
  'S-H': 363, 'S=O': 523,
};

const FUELS: Record<string, { formula: string; heatKJ: number; molarMass: number }> = {
  'ميثان (CH₄)': { formula: 'CH₄ + 2O₂ → CO₂ + 2H₂O', heatKJ: -890, molarMass: 16 },
  'إيثانول (C₂H₅OH)': { formula: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O', heatKJ: -1367, molarMass: 46 },
  'بروبان (C₃H₈)': { formula: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O', heatKJ: -2220, molarMass: 44 },
  'أوكتان (C₈H₁₈)': { formula: '2C₈H₁₈ + 25O₂ → 16CO₂ + 18H₂O', heatKJ: -5471, molarMass: 114 },
  'هيدروجين (H₂)': { formula: '2H₂ + O₂ → 2H₂O', heatKJ: -572, molarMass: 2 },
  'خشب (سيلولوز)': { formula: '(C₆H₁₀O₅)n + 6O₂ → 6CO₂ + 5H₂O', heatKJ: -2800, molarMass: 162 },
};

const FOOD_CAL: Record<string, number> = {
  'كربوهيدرات': 4, 'بروتين': 4, 'دهون': 9, 'ألياف': 2,
};

const SPECIFIC_HEATS: Record<string, number> = {
  'ماء': 4.184, 'حديد': 0.449, 'نحاس': 0.385, 'ألمنيوم': 0.897,
  'رصاص': 0.128, 'فضة': 0.235, 'ذهب': 0.129, 'زجاج': 0.84,
};

// ─── Calculator Definitions ─────────────────
const CALCULATORS = [
  { id: 'bond', title: 'حرارة التفاعل من طاقة الروابط', icon: Link, color: '#3B82F6', desc: 'ΔH = Σ(مكسورة) − Σ(متكونة)' },
  { id: 'calorimetry', title: 'المسعر الحراري (Q = mcΔT)', icon: Thermometer, color: '#8B5CF6', desc: 'حساب كمية الحرارة المكتسبة أو المفقودة' },
  { id: 'combustion', title: 'حرارة الاحتراق', icon: Flame, color: '#EF4444', desc: 'مقارنة طاقة احتراق أنواع الوقود' },
  { id: 'food', title: 'السعرات الحرارية للغذاء', icon: Utensils, color: '#10B981', desc: 'حساب طاقة الوجبة من مكوناتها' },
  { id: 'hess', title: 'قانون هِس (جمع المعادلات)', icon: Beaker, color: '#F59E0B', desc: 'حساب ΔH الكلي بجمع خطوات الدورة' },
];

// ─── Types ───────────────────────────────────
interface BondEntry { bond: string; count: number; }
interface FoodEntry { type: string; grams: number; }
interface HessStep { equation: string; deltaH: number; multiplier: number; reverse: boolean; }
interface CalcResult { value: number; unit: string; label: string; reactionType?: string; steps: string[]; }

export default function CalculatorPage() {
  const [activeCalc, setActiveCalc] = useState<string | null>(null);
  const [result, setResult] = useState<CalcResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Bond
  const [brokenBonds, setBrokenBonds] = useState<BondEntry[]>([{ bond: 'H-H', count: 1 }, { bond: 'F-F', count: 1 }]);
  const [formedBonds, setFormedBonds] = useState<BondEntry[]>([{ bond: 'H-F', count: 2 }]);

  // Calorimetry
  const [caloData, setCaloData] = useState({ substance: 'ماء', mass: 200, tempInitial: 25, tempFinal: 75 });

  // Combustion
  const [selectedFuel, setSelectedFuel] = useState('ميثان (CH₄)');
  const [fuelMass, setFuelMass] = useState(100);

  // Food
  const [foodItems, setFoodItems] = useState<FoodEntry[]>([{ type: 'كربوهيدرات', grams: 50 }, { type: 'دهون', grams: 20 }, { type: 'بروتين', grams: 30 }]);

  // Hess
  const [hessSteps, setHessSteps] = useState<HessStep[]>([
    { equation: 'C + O₂ → CO₂', deltaH: -393.5, multiplier: 1, reverse: false },
    { equation: 'H₂ + ½O₂ → H₂O', deltaH: -285.8, multiplier: 2, reverse: false },
    { equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O', deltaH: -890.4, multiplier: 1, reverse: true },
  ]);

  const bondOptions = Object.keys(BOND_ENERGIES);
  const fuelOptions = Object.keys(FUELS);
  const foodOptions = Object.keys(FOOD_CAL);
  const substanceOptions = Object.keys(SPECIFIC_HEATS);

  // ─── Calculation Engines ────────────────────
  const calculate = () => {
    switch (activeCalc) {
      case 'bond': calcBond(); break;
      case 'calorimetry': calcCalorimetry(); break;
      case 'combustion': calcCombustion(); break;
      case 'food': calcFood(); break;
      case 'hess': calcHess(); break;
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const calcBond = () => {
    const steps: string[] = [];
    steps.push('📌 القانون: ΔH = Σ طاقة الروابط المكسّرة − Σ طاقة الروابط المتكوّنة');
    steps.push('');
    steps.push('━━━ الخطوة 1: حساب طاقة الروابط المكسّرة (المتفاعلات) ━━━');

    let totalBroken = 0;
    brokenBonds.forEach(b => {
      const energy = BOND_ENERGIES[b.bond] || 0;
      const sub = b.count * energy;
      totalBroken += sub;
      steps.push(`   ${b.bond} × ${b.count} = ${b.count} × ${energy} = +${sub} kJ`);
    });
    steps.push(`   ▸ المجموع = +${totalBroken} kJ`);

    steps.push('');
    steps.push('━━━ الخطوة 2: حساب طاقة الروابط المتكوّنة (النواتج) ━━━');

    let totalFormed = 0;
    formedBonds.forEach(b => {
      const energy = BOND_ENERGIES[b.bond] || 0;
      const sub = b.count * energy;
      totalFormed += sub;
      steps.push(`   ${b.bond} × ${b.count} = ${b.count} × ${energy} = +${sub} kJ`);
    });
    steps.push(`   ▸ المجموع = +${totalFormed} kJ`);

    steps.push('');
    steps.push('━━━ الخطوة 3: حساب ΔH ━━━');
    const deltaH = totalBroken - totalFormed;
    steps.push(`   ΔH = ${totalBroken} − ${totalFormed} = ${deltaH} kJ`);

    const reactionType = deltaH < 0 ? 'تفاعل طارد للحرارة (Exothermic) 🔥' : deltaH > 0 ? 'تفاعل ماص للحرارة (Endothermic) ❄️' : 'لا يوجد تغيّر';
    steps.push(`   ▸ النوع: ${reactionType}`);

    setResult({ value: deltaH, unit: 'kJ', label: 'ΔH', reactionType, steps });
  };

  const calcCalorimetry = () => {
    const steps: string[] = [];
    const c = SPECIFIC_HEATS[caloData.substance];
    const deltaT = caloData.tempFinal - caloData.tempInitial;
    const Q = caloData.mass * c * deltaT;

    steps.push('📌 القانون: Q = m × c × ΔT');
    steps.push('');
    steps.push('━━━ الخطوة 1: تحديد المعطيات ━━━');
    steps.push(`   المادة: ${caloData.substance}`);
    steps.push(`   الكتلة (m) = ${caloData.mass} g`);
    steps.push(`   الحرارة النوعية (c) = ${c} J/(g·°C)`);
    steps.push(`   درجة الحرارة الابتدائية = ${caloData.tempInitial} °C`);
    steps.push(`   درجة الحرارة النهائية = ${caloData.tempFinal} °C`);

    steps.push('');
    steps.push('━━━ الخطوة 2: حساب التغيّر في درجة الحرارة ━━━');
    steps.push(`   ΔT = ${caloData.tempFinal} − ${caloData.tempInitial} = ${deltaT} °C`);

    steps.push('');
    steps.push('━━━ الخطوة 3: تطبيق القانون ━━━');
    steps.push(`   Q = ${caloData.mass} × ${c} × ${deltaT}`);
    steps.push(`   Q = ${Q.toFixed(2)} J = ${(Q / 1000).toFixed(3)} kJ`);

    steps.push('');
    if (Q > 0) steps.push('   ▸ الحرارة مكتسبة (المادة تسخن) 🔥');
    else if (Q < 0) steps.push('   ▸ الحرارة مفقودة (المادة تبرد) ❄️');
    else steps.push('   ▸ لا يوجد تغيّر في الحرارة');

    setResult({ value: parseFloat(Q.toFixed(2)), unit: 'J', label: 'Q', steps });
  };

  const calcCombustion = () => {
    const steps: string[] = [];
    const fuel = FUELS[selectedFuel];
    const moles = fuelMass / fuel.molarMass;
    const totalEnergy = moles * fuel.heatKJ;
    const energyPerGram = fuel.heatKJ / fuel.molarMass;

    steps.push('📌 حساب حرارة الاحتراق');
    steps.push('');
    steps.push('━━━ الخطوة 1: معادلة الاحتراق ━━━');
    steps.push(`   ${fuel.formula}`);
    steps.push(`   ΔH = ${fuel.heatKJ} kJ/mol`);

    steps.push('');
    steps.push('━━━ الخطوة 2: حساب عدد المولات ━━━');
    steps.push(`   الكتلة المولية = ${fuel.molarMass} g/mol`);
    steps.push(`   عدد المولات = ${fuelMass} ÷ ${fuel.molarMass} = ${moles.toFixed(3)} mol`);

    steps.push('');
    steps.push('━━━ الخطوة 3: حساب الطاقة الكلية ━━━');
    steps.push(`   Q = ${moles.toFixed(3)} × (${fuel.heatKJ}) = ${totalEnergy.toFixed(2)} kJ`);
    steps.push(`   الطاقة لكل غرام = ${energyPerGram.toFixed(2)} kJ/g`);

    setResult({ value: parseFloat(totalEnergy.toFixed(2)), unit: 'kJ', label: 'Q (احتراق)', steps });
  };

  const calcFood = () => {
    const steps: string[] = [];
    steps.push('📌 حساب السعرات الحرارية للوجبة');
    steps.push('');
    steps.push('━━━ القاعدة ━━━');
    steps.push('   كربوهيدرات: 4 سعرات/غرام | بروتين: 4 سعرات/غرام');
    steps.push('   دهون: 9 سعرات/غرام | ألياف: 2 سعرات/غرام');

    steps.push('');
    steps.push('━━━ الحساب التفصيلي ━━━');

    let total = 0;
    foodItems.forEach(item => {
      const calPerGram = FOOD_CAL[item.type] || 0;
      const sub = item.grams * calPerGram;
      total += sub;
      steps.push(`   ${item.type}: ${item.grams}g × ${calPerGram} Cal/g = ${sub} Cal`);
    });

    steps.push('');
    steps.push('━━━ النتيجة ━━━');
    steps.push(`   المجموع = ${total} سعر حراري (Cal)`);
    steps.push(`   بالكيلو جول = ${(total * 4.184).toFixed(1)} kJ`);

    setResult({ value: total, unit: 'Cal', label: 'السعرات الكلية', steps });
  };

  const calcHess = () => {
    const steps: string[] = [];
    steps.push('📌 قانون هِس: ΔH الكلي = مجموع ΔH لكل خطوة (مع مراعاة الضرب والعكس)');
    steps.push('');

    let total = 0;
    hessSteps.forEach((s, i) => {
      let adjusted = s.deltaH * s.multiplier;
      if (s.reverse) adjusted = -adjusted;
      total += adjusted;
      steps.push(`━━━ الخطوة ${i + 1} ━━━`);
      steps.push(`   المعادلة: ${s.equation}`);
      steps.push(`   ΔH الأصلي = ${s.deltaH} kJ`);
      if (s.reverse) steps.push(`   ⇄ عكس الاتجاه → ΔH = ${-s.deltaH} kJ`);
      if (s.multiplier !== 1) steps.push(`   × ${s.multiplier} → ΔH = ${adjusted} kJ`);
      steps.push(`   ▸ المساهمة = ${adjusted.toFixed(1)} kJ`);
      steps.push('');
    });

    steps.push('━━━ النتيجة الكلية ━━━');
    steps.push(`   ΔH = ${total.toFixed(1)} kJ`);

    setResult({ value: parseFloat(total.toFixed(1)), unit: 'kJ', label: 'ΔH (هِس)', steps });
  };

  const resetResult = () => setResult(null);
  const goBack = () => { setActiveCalc(null); setResult(null); };

  // ─── Input Forms ────────────────────────────
  const renderInput = () => {
    switch (activeCalc) {
      case 'bond': return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#EF4444', marginBottom: '12px', fontWeight: 700 }}>🔴 الروابط المكسّرة (المتفاعلات)</h4>
            {brokenBonds.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <select className="input-field" value={b.bond} onChange={e => { const n = [...brokenBonds]; n[i].bond = e.target.value; setBrokenBonds(n); }} style={{ flex: 1 }}>
                  {bondOptions.map(k => <option key={k} value={k}>{k} — {BOND_ENERGIES[k]} kJ</option>)}
                </select>
                <input type="number" className="input-field" value={b.count} min={1} onChange={e => { const n = [...brokenBonds]; n[i].count = +e.target.value; setBrokenBonds(n); }} style={{ width: '65px' }} />
                {brokenBonds.length > 1 && <button onClick={() => setBrokenBonds(brokenBonds.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>×</button>}
              </div>
            ))}
            <button onClick={() => setBrokenBonds([...brokenBonds, { bond: 'H-H', count: 1 }])} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ar)', fontWeight: 600 }}>+ إضافة رابطة</button>
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#10B981', marginBottom: '12px', fontWeight: 700 }}>🟢 الروابط المتكوّنة (النواتج)</h4>
            {formedBonds.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <select className="input-field" value={b.bond} onChange={e => { const n = [...formedBonds]; n[i].bond = e.target.value; setFormedBonds(n); }} style={{ flex: 1 }}>
                  {bondOptions.map(k => <option key={k} value={k}>{k} — {BOND_ENERGIES[k]} kJ</option>)}
                </select>
                <input type="number" className="input-field" value={b.count} min={1} onChange={e => { const n = [...formedBonds]; n[i].count = +e.target.value; setFormedBonds(n); }} style={{ width: '65px' }} />
                {formedBonds.length > 1 && <button onClick={() => setFormedBonds(formedBonds.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>×</button>}
              </div>
            ))}
            <button onClick={() => setFormedBonds([...formedBonds, { bond: 'H-F', count: 1 }])} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ar)', fontWeight: 600 }}>+ إضافة رابطة</button>
          </div>
        </div>
      );

      case 'calorimetry': return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>المادة</label>
            <select className="input-field" value={caloData.substance} onChange={e => setCaloData({ ...caloData, substance: e.target.value })} style={{ width: '100%' }}>
              {substanceOptions.map(k => <option key={k} value={k}>{k} — c = {SPECIFIC_HEATS[k]} J/(g·°C)</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>الكتلة (غرام)</label>
            <input type="number" className="input-field" value={caloData.mass} onChange={e => setCaloData({ ...caloData, mass: +e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>درجة الحرارة الابتدائية (°C)</label>
            <input type="number" className="input-field" value={caloData.tempInitial} onChange={e => setCaloData({ ...caloData, tempInitial: +e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>درجة الحرارة النهائية (°C)</label>
            <input type="number" className="input-field" value={caloData.tempFinal} onChange={e => setCaloData({ ...caloData, tempFinal: +e.target.value })} style={{ width: '100%' }} />
          </div>
        </div>
      );

      case 'combustion': return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>نوع الوقود</label>
            <select className="input-field" value={selectedFuel} onChange={e => setSelectedFuel(e.target.value)} style={{ width: '100%' }}>
              {fuelOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', fontFamily: 'monospace' }}>
              {FUELS[selectedFuel].formula}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>كتلة الوقود (غرام)</label>
            <input type="number" className="input-field" value={fuelMass} onChange={e => setFuelMass(+e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      );

      case 'food': return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>نوع المكوّن</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>الكمية (غرام)</span>
            <span />
          </div>
          {foodItems.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <select className="input-field" value={item.type} onChange={e => { const n = [...foodItems]; n[i].type = e.target.value; setFoodItems(n); }}>
                {foodOptions.map(k => <option key={k} value={k}>{k} ({FOOD_CAL[k]} Cal/g)</option>)}
              </select>
              <input type="number" className="input-field" value={item.grams} onChange={e => { const n = [...foodItems]; n[i].grams = +e.target.value; setFoodItems(n); }} />
              {foodItems.length > 1 && <button onClick={() => setFoodItems(foodItems.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>}
            </div>
          ))}
          <button onClick={() => setFoodItems([...foodItems, { type: 'بروتين', grams: 10 }])} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ar)', fontWeight: 600 }}>+ إضافة مكوّن</button>
        </div>
      );

      case 'hess': return (
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            أدخل الخطوات الوسيطة مع ΔH لكل منها. حدد إذا كانت معكوسة أو مضروبة بمعامل.
          </div>
          {hessSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="input-field" value={s.equation} onChange={e => { const n = [...hessSteps]; n[i].equation = e.target.value; setHessSteps(n); }} placeholder="المعادلة" style={{ flex: 2, minWidth: '200px' }} />
              <input type="number" className="input-field" value={s.deltaH} onChange={e => { const n = [...hessSteps]; n[i].deltaH = +e.target.value; setHessSteps(n); }} style={{ width: '100px' }} placeholder="ΔH" />
              <input type="number" className="input-field" value={s.multiplier} min={1} onChange={e => { const n = [...hessSteps]; n[i].multiplier = +e.target.value; setHessSteps(n); }} style={{ width: '60px' }} placeholder="×" />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={s.reverse} onChange={e => { const n = [...hessSteps]; n[i].reverse = e.target.checked; setHessSteps(n); }} />
                عكس؟
              </label>
              {hessSteps.length > 1 && <button onClick={() => setHessSteps(hessSteps.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>}
            </div>
          ))}
          <button onClick={() => setHessSteps([...hessSteps, { equation: '', deltaH: 0, multiplier: 1, reverse: false }])} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ar)', fontWeight: 600 }}>+ إضافة خطوة</button>
        </div>
      );

      default: return null;
    }
  };

  // ─── Render ─────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
        <span className="gradient-text">الحسابات الكيميائية</span>
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>5 أنواع حاسبات مع خطوات الحل التفصيلية</p>

      {/* Calculator Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {CALCULATORS.map(calc => (
          <button
            key={calc.id}
            onClick={() => { setActiveCalc(calc.id); setResult(null); }}
            className="glass-card"
            style={{
              padding: '16px', cursor: 'pointer', textAlign: 'right',
              border: activeCalc === calc.id ? `2px solid ${calc.color}` : undefined,
              fontFamily: 'var(--font-ar)',
              boxShadow: activeCalc === calc.id ? `0 0 20px ${calc.color}25` : undefined,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: `${calc.color}20`, padding: '10px', borderRadius: '50%', display: 'flex' }}>
                <calc.icon size={24} color={calc.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{calc.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{calc.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Calculator Input */}
      <AnimatePresence mode="wait">
        {activeCalc && (
          <motion.div
            key={activeCalc}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card"
            style={{ padding: '24px', marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} />
                {CALCULATORS.find(c => c.id === activeCalc)?.title}
              </h3>
              <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-ar)', fontSize: '0.85rem' }}>
                <ChevronLeft size={16} /> رجوع
              </button>
            </div>

            {renderInput()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={calculate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={18} /> احسب
              </button>
              <button className="btn-secondary" onClick={resetResult} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} /> مسح النتيجة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{ padding: '24px', marginTop: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '50%', display: 'flex' }}>
                <Calculator size={28} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>النتيجة</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: result.value < 0 ? '#EF4444' : '#10B981' }}>
                  {result.label} = {result.value} {result.unit}
                </div>
                {result.reactionType && (
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{result.reactionType}</div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>📝 خطوات الحل التفصيلية</h4>
              <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '16px', direction: 'rtl' }}>
                {result.steps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      padding: step.startsWith('━') ? '8px 0 4px' : step === '' ? '4px' : '4px 8px',
                      fontSize: step.startsWith('━') ? '0.95rem' : '0.9rem',
                      fontWeight: step.startsWith('━') || step.startsWith('📌') ? 700 : 400,
                      color: step.startsWith('━') ? 'var(--color-primary)' : step.startsWith('   ▸') ? 'var(--color-success)' : 'var(--color-text)',
                      fontFamily: step.includes('=') || step.includes('×') ? 'monospace, var(--font-ar)' : 'var(--font-ar)',
                      lineHeight: 1.6,
                    }}
                  >
                    {step || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
