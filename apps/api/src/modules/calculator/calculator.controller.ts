import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CalculatorService } from './calculator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('الحسابات الكيميائية')
@Controller('calculator')
export class CalculatorController {
  constructor(private calculatorService: CalculatorService) {}

  @Post('bond-energy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateBondEnergy(
    @Req() req: any,
    @Body() body: {
      brokenBonds: { bond: string; count: number }[];
      formedBonds: { bond: string; count: number }[];
      mode?: 'compute' | 'guide' | 'verify';
    },
  ) {
    const result = this.calculatorService.calculateBondEnergy(
      body.brokenBonds,
      body.formedBonds,
      body.mode || 'compute',
    );
    await this.calculatorService.saveRun(req.user.sub, 'BOND_ENERGY', body, result);
    return result;
  }

  @Post('thermal-equation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateThermalEquation(
    @Req() req: any,
    @Body() body: { moles: number; energyPerMole: number; molarMass?: number; massGrams?: number },
  ) {
    const result = this.calculatorService.calculateThermalEquation(
      body.moles,
      body.energyPerMole,
      body.molarMass,
      body.massGrams,
    );
    await this.calculatorService.saveRun(req.user.sub, 'THERMAL_EQUATION', body, result);
    return result;
  }

  @Post('combustion-heat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateCombustionHeat(
    @Req() req: any,
    @Body() body: { fuel: string; massGrams?: number },
  ) {
    const result = this.calculatorService.calculateCombustionHeat(body.fuel, body.massGrams ?? 100);
    await this.calculatorService.saveRun(req.user.sub, 'COMBUSTION_HEAT', body, result);
    return result;
  }

  @Post('calorimetry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateCalorimetry(
    @Req() req: any,
    @Body() body: { substance: string; mass: number; tempInitial: number; tempFinal: number },
  ) {
    const result = this.calculatorService.calculateCalorimetry(
      body.substance,
      body.mass,
      body.tempInitial,
      body.tempFinal,
    );
    await this.calculatorService.saveRun(req.user.sub, 'CALORIMETRY', body, result);
    return result;
  }

  @Post('hess')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateHess(
    @Req() req: any,
    @Body() body: { steps: { equation: string; deltaH: number; multiplier: number; reverse: boolean }[] },
  ) {
    const result = this.calculatorService.calculateHess(body.steps);
    await this.calculatorService.saveRun(req.user.sub, 'HESS', body, result);
    return result;
  }

  @Post('food-calories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async calculateFoodCalories(
    @Req() req: any,
    @Body() body: { items: { type: string; grams: number }[] },
  ) {
    const result = this.calculatorService.calculateFoodCalories(body.items);
    await this.calculatorService.saveRun(req.user.sub, 'FOOD_CALORIES', body, result);
    return result;
  }

  @Get('tables')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getReferenceTables() {
    return this.calculatorService.getReferenceTables();
  }

  @Get('bond-energies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getBondEnergies() {
    return this.calculatorService.getBondEnergyTable();
  }
}
