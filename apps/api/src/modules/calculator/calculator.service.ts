import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Bond energy table (kJ/mol) from Table 5-1 in the unit
const BOND_ENERGIES: Record<string, number> = {
  'H-H': 436, 'H-F': 565, 'H-Cl': 431, 'H-Br': 366,
  'H-I': 298, 'H-N': 391, 'H-O': 464, 'H-C': 413,
  'H-S': 364, 'C-C': 347, 'C=C': 614, 'C≡C': 839,
  'C-N': 305, 'C=N': 615, 'C≡N': 891, 'C-O': 358,
  'C=O': 724, 'C-F': 489, 'C-Cl': 339, 'C-Br': 276,
  'N-N': 163, 'N=N': 418, 'N≡N': 946, 'N-O': 201,
  'O-O': 146, 'O=O': 498, 'F-F': 158, 'Cl-Cl': 242,
  'Br-Br': 193, 'I-I': 151, 'S-S': 266, 'S=O': 523,
};

// Combustion heats (kJ/mol) from Table 5-2
const COMBUSTION_HEATS: Record<string, number> = {
  'كربون': 394, 'هيدروجين': 286, 'ميثان': 890,
  'إيثان': 1560, 'بروبان': 2220, 'بيوتان': 2855,
  'إيثانول': 1367, 'بروبانول': 2010,
};

// Caloric values (kJ/g) from Table 5-3
const FUEL_VALUES: Record<string, number> = {
  'فحم خشب': 18, 'فحم حجري': 31, 'بنزين': 45,
  'بترول خام': 48, 'غاز طبيعي': 49, 'غاز طبخ': 47.9,
};

// Food caloric values (cal/g) from Table 5-4
const FOOD_CALORIES: Record<string, number> = {
  'كربوهيدرات': 4.07, 'دهون': 9.08, 'بروتين': 4.07,
  'خبز': 2.87, 'عسل': 3.18,
};

// Specific heat values (J/(g·°C))
const SPECIFIC_HEATS: Record<string, number> = {
  'ماء': 4.184, 'حديد': 0.449, 'نحاس': 0.385, 'ألمنيوم': 0.897,
  'رصاص': 0.128, 'فضة': 0.235, 'ذهب': 0.129, 'زجاج': 0.84,
};

export type CalcMode = 'compute' | 'guide' | 'verify';

@Injectable()
export class CalculatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * حساب حرارة التفاعل من طاقات الروابط
   * ΔH = مجموع طاقات الروابط المكسورة - مجموع طاقات الروابط المتكونة
   */
  calculateBondEnergy(
    brokenBonds: { bond: string; count: number }[],
    formedBonds: { bond: string; count: number }[],
    mode: CalcMode = 'compute',
  ) {
    const brokenTotal = brokenBonds.reduce((sum, b) => {
      const energy = BOND_ENERGIES[b.bond] ?? 0;
      return sum + energy * b.count;
    }, 0);

    const formedTotal = formedBonds.reduce((sum, b) => {
      const energy = BOND_ENERGIES[b.bond] ?? 0;
      return sum + energy * b.count;
    }, 0);

    const deltaH = brokenTotal - formedTotal;
    const reactionType = deltaH > 0 ? 'ماص للطاقة (ΔH موجبة)' : 'طارد للطاقة (ΔH سالبة)';

    const steps = [
      `الخطوة 1: حدد الروابط المكسورة (في المتفاعلات): ${brokenBonds.map((b) => `${b.count} × ${b.bond} = ${(BOND_ENERGIES[b.bond] ?? 0) * b.count} kJ`).join(' + ')}`,
      `مجموع طاقات الروابط المكسورة = ${brokenTotal} kJ`,
      `الخطوة 2: حدد الروابط المتكونة (في النواتج): ${formedBonds.map((b) => `${b.count} × ${b.bond} = ${(BOND_ENERGIES[b.bond] ?? 0) * b.count} kJ`).join(' + ')}`,
      `مجموع طاقات الروابط المتكونة = ${formedTotal} kJ`,
      `الخطوة 3: ΔH = ${brokenTotal} - ${formedTotal} = ${deltaH} kJ`,
      `النتيجة: التفاعل ${reactionType}`,
    ];

    return {
      brokenTotal,
      formedTotal,
      deltaH,
      reactionType,
      steps: mode === 'compute' ? [steps[steps.length - 1]] : steps,
      unit: 'kJ',
    };
  }

  /**
   * حساب الطاقة من المعادلة الحرارية (النسبة والتناسب)
   */
  calculateThermalEquation(
    moles: number,
    energyPerMole: number,
    molarMass?: number,
    massGrams?: number,
  ) {
    let actualMoles = moles;
    if (massGrams && molarMass) {
      actualMoles = massGrams / molarMass;
    }
    const totalEnergy = actualMoles * energyPerMole;

    return {
      moles: actualMoles,
      energyPerMole,
      totalEnergy,
      steps: [
        molarMass && massGrams ? `عدد المولات = ${massGrams} ÷ ${molarMass} = ${actualMoles.toFixed(2)} mol` : `عدد المولات = ${moles}`,
        `الطاقة = ${actualMoles.toFixed(2)} × ${energyPerMole} = ${totalEnergy.toFixed(2)} kJ`,
      ],
      unit: 'kJ',
    };
  }

  /**
   * حساب حرارة الاحتراق
   */
  calculateCombustionHeat(fuel: string, massGrams: number = 100) {
    const matchedKey = Object.keys(COMBUSTION_HEATS).find(k => fuel.includes(k));
    if (!matchedKey) {
      return { error: 'وقود غير موجود في الجدول', availableFuels: Object.keys(COMBUSTION_HEATS) };
    }
    const heatPerMol = COMBUSTION_HEATS[matchedKey];

    // Molar masses and formulas map
    const FUELS_METADATA: Record<string, { formula: string; molarMass: number }> = {
      'ميثان': { formula: 'CH₄ + 2O₂ → CO₂ + 2H₂O', molarMass: 16 },
      'إيثانول': { formula: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O', molarMass: 46 },
      'بروبان': { formula: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O', molarMass: 44 },
      'بيوتان': { formula: 'C₄H₁₀ + 6.5O₂ → 4CO₂ + 5H₂O', molarMass: 58 },
      'هيدروجين': { formula: '2H₂ + O₂ → 2H₂O', molarMass: 2 },
      'كربون': { formula: 'C + O₂ → CO₂', molarMass: 12 },
    };

    const metadata = FUELS_METADATA[matchedKey] ?? { formula: `${matchedKey} + O₂ → Products`, molarMass: 30 };
    const moles = massGrams / metadata.molarMass;
    const totalEnergy = moles * -heatPerMol; // Combustion is exothermic (negative deltaH)
    const energyPerGram = -heatPerMol / metadata.molarMass;

    const steps = [
      `📌 حساب حرارة الاحتراق`,
      ``,
      `━━━ الخطوة 1: معادلة الاحتراق ━━━`,
      `   ${metadata.formula}`,
      `   ΔH = -${heatPerMol} kJ/mol`,
      ``,
      `━━━ الخطوة 2: حساب عدد المولات ━━━`,
      `   الكتلة المولية = ${metadata.molarMass} g/mol`,
      `   عدد المولات = ${massGrams} ÷ ${metadata.molarMass} = ${moles.toFixed(3)} mol`,
      ``,
      `━━━ الخطوة 3: حساب الطاقة الكلية ━━━`,
      `   Q = ${moles.toFixed(3)} × (-${heatPerMol}) = ${totalEnergy.toFixed(2)} kJ`,
      `   الطاقة لكل غرام = ${energyPerGram.toFixed(2)} kJ/g`,
    ];

    return {
      value: parseFloat(totalEnergy.toFixed(2)),
      unit: 'kJ',
      label: 'Q (احتراق)',
      steps,
    };
  }

  /**
   * حساب المسعر الحراري (Q = mcΔT)
   */
  calculateCalorimetry(substance: string, mass: number, tempInitial: number, tempFinal: number) {
    const c = SPECIFIC_HEATS[substance] ?? 4.184;
    const deltaT = tempFinal - tempInitial;
    const Q = mass * c * deltaT;

    const steps = [
      `📌 القانون: Q = m × c × ΔT`,
      ``,
      `━━━ الخطوة 1: تحديد المعطيات ━━━`,
      `   المادة: ${substance}`,
      `   الكتلة (m) = ${mass} g`,
      `   الحرارة النوعية (c) = ${c} J/(g·°C)`,
      `   درجة الحرارة الابتدائية = ${tempInitial} °C`,
      `   درجة الحرارة النهائية = ${tempFinal} °C`,
      ``,
      `━━━ الخطوة 2: حساب التغيّر في درجة الحرارة ━━━`,
      `   ΔT = ${tempFinal} − ${tempInitial} = ${deltaT} °C`,
      ``,
      `━━━ الخطوة 3: تطبيق القانون ━━━`,
      `   Q = ${mass} × ${c} × ${deltaT}`,
      `   Q = ${Q.toFixed(2)} J = ${(Q / 1000).toFixed(3)} kJ`,
    ];

    if (Q > 0) {
      steps.push(`   ▸ الحرارة مكتسبة (المادة تسخن) 🔥`);
    } else if (Q < 0) {
      steps.push(`   ▸ الحرارة مفقودة (المادة تبرد) ❄️`);
    } else {
      steps.push(`   ▸ لا يوجد تغيّر في الحرارة`);
    }

    return {
      value: parseFloat(Q.toFixed(2)),
      unit: 'J',
      label: 'Q',
      steps,
    };
  }

  /**
   * حساب قانون هس (جمع المعادلات)
   */
  calculateHess(stepsList: { equation: string; deltaH: number; multiplier: number; reverse: boolean }[]) {
    const steps: string[] = [
      '📌 قانون هِس: ΔH الكلي = مجموع ΔH لكل خطوة (مع مراعاة الضرب والعكس)',
      '',
    ];

    let total = 0;
    stepsList.forEach((s, i) => {
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

    return {
      value: parseFloat(total.toFixed(1)),
      unit: 'kJ',
      label: 'ΔH (هِس)',
      steps,
    };
  }

  /**
   * حساب القيمة الحرارية للغذاء
   */
  calculateFoodCalories(
    items: { type: string; grams: number }[],
  ) {
    const breakdown = items.map((item) => {
      const calPerGram = FOOD_CALORIES[item.type] ?? 0;
      const totalCal = calPerGram * item.grams;
      return {
        type: item.type,
        grams: item.grams,
        calPerGram,
        totalCalories: totalCal,
      };
    });

    const totalCalories = breakdown.reduce((sum, b) => sum + b.totalCalories, 0);
    const totalJoules = totalCalories * 4.18;

    return {
      breakdown,
      totalCalories,
      totalJoules,
      steps: [
        ...breakdown.map((b) => `${b.type}: ${b.grams} غم × ${b.calPerGram} سعر/غم = ${b.totalCalories.toFixed(2)} سعر`),
        `المجموع = ${totalCalories.toFixed(2)} سعر حراري`,
        `بالجول = ${totalCalories.toFixed(2)} × 4.18 = ${totalJoules.toFixed(2)} جول`,
      ],
      unit: 'سعر حراري',
    };
  }

  /**
   * Save calculator run
   */
  async saveRun(userId: string, type: string, input: any, result: any) {
    return this.prisma.calculatorRun.create({
      data: {
        userId,
        type,
        inputJson: input,
        resultJson: result,
      },
    });
  }

  /**
   * Get bond energy table
   */
  getBondEnergyTable() {
    return BOND_ENERGIES;
  }

  /**
   * Get all reference tables
   */
  getReferenceTables() {
    return {
      bondEnergies: BOND_ENERGIES,
      combustionHeats: COMBUSTION_HEATS,
      fuelValues: FUEL_VALUES,
      foodCalories: FOOD_CALORIES,
      specificHeats: SPECIFIC_HEATS,
    };
  }
}
