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
  calculateCombustionHeat(fuel: string, massGrams?: number) {
    const heatPerMol = COMBUSTION_HEATS[fuel];
    if (!heatPerMol) {
      return { error: 'وقود غير موجود في الجدول', availableFuels: Object.keys(COMBUSTION_HEATS) };
    }

    return {
      fuel,
      heatPerMol,
      fuelValues: FUEL_VALUES,
      combustionHeats: COMBUSTION_HEATS,
      unit: 'kJ/mol',
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
    };
  }
}
