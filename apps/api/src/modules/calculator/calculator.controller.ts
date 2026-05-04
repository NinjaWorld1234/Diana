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
  calculateBondEnergy(
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
    this.calculatorService.saveRun(req.user.sub, 'BOND_ENERGY', body, result);
    return result;
  }

  @Post('thermal-equation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  calculateThermalEquation(
    @Req() req: any,
    @Body() body: { moles: number; energyPerMole: number; molarMass?: number; massGrams?: number },
  ) {
    const result = this.calculatorService.calculateThermalEquation(
      body.moles,
      body.energyPerMole,
      body.molarMass,
      body.massGrams,
    );
    this.calculatorService.saveRun(req.user.sub, 'THERMAL_EQUATION', body, result);
    return result;
  }

  @Post('combustion-heat')
  calculateCombustionHeat(@Body() body: { fuel: string; massGrams?: number }) {
    return this.calculatorService.calculateCombustionHeat(body.fuel, body.massGrams);
  }

  @Post('food-calories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  calculateFoodCalories(
    @Req() req: any,
    @Body() body: { items: { type: string; grams: number }[] },
  ) {
    const result = this.calculatorService.calculateFoodCalories(body.items);
    this.calculatorService.saveRun(req.user.sub, 'FOOD_CALORIES', body, result);
    return result;
  }

  @Get('tables')
  getReferenceTables() {
    return this.calculatorService.getReferenceTables();
  }

  @Get('bond-energies')
  getBondEnergies() {
    return this.calculatorService.getBondEnergyTable();
  }
}
