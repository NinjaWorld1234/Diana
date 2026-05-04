import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('إدارة المفاتيح')
@Controller('admin/api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private prisma: PrismaService) {}

  // Verify the user is ADMIN
  private async assertAdmin(req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('هذه الصفحة متاحة للمدير فقط');
    }
  }

  @Get()
  async listKeys(@Req() req: any) {
    await this.assertAdmin(req);
    const keys = await this.prisma.geminiApiKey.findMany({
      orderBy: { priority: 'asc' },
    });
    // Mask API keys for security — show only first 8 and last 4 chars
    return keys.map(k => ({
      ...k,
      apiKey: k.apiKey.length > 12
        ? k.apiKey.substring(0, 8) + '••••••••' + k.apiKey.slice(-4)
        : '••••••••',
    }));
  }

  @Post()
  async addKey(
    @Req() req: any,
    @Body() body: { label: string; apiKey: string; priority?: number },
  ) {
    await this.assertAdmin(req);

    // Check limit
    const count = await this.prisma.geminiApiKey.count();
    if (count >= 10) {
      throw new ForbiddenException('الحد الأقصى 10 مفاتيح. احذف مفتاحاً قبل إضافة جديد.');
    }

    return this.prisma.geminiApiKey.create({
      data: {
        label: body.label || `مفتاح ${count + 1}`,
        apiKey: body.apiKey,
        priority: body.priority ?? count,
      },
    });
  }

  @Patch(':id')
  async updateKey(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { label?: string; apiKey?: string; isActive?: boolean; priority?: number },
  ) {
    await this.assertAdmin(req);
    return this.prisma.geminiApiKey.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.apiKey !== undefined && { apiKey: body.apiKey }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.priority !== undefined && { priority: body.priority }),
        // Clear error when re-activating
        ...(body.isActive === true && { lastError: null }),
      },
    });
  }

  @Delete(':id')
  async deleteKey(@Req() req: any, @Param('id') id: string) {
    await this.assertAdmin(req);

    // Don't allow deleting the last active key
    const activeCount = await this.prisma.geminiApiKey.count({ where: { isActive: true } });
    const keyToDelete = await this.prisma.geminiApiKey.findUnique({ where: { id } });
    if (activeCount <= 1 && keyToDelete?.isActive) {
      throw new ForbiddenException('لا يمكن حذف المفتاح الأخير النشط. أضف مفتاحاً آخر أولاً.');
    }

    await this.prisma.geminiApiKey.delete({ where: { id } });
    return { success: true };
  }

  @Post(':id/test')
  async testKey(@Req() req: any, @Param('id') id: string) {
    await this.assertAdmin(req);
    const key = await this.prisma.geminiApiKey.findUnique({ where: { id } });
    if (!key) throw new ForbiddenException('مفتاح غير موجود');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('قل "مرحباً" فقط.');
      const text = result.response.text();
      
      // Update as working
      await this.prisma.geminiApiKey.update({
        where: { id },
        data: { lastError: null, isActive: true },
      });
      
      return { success: true, response: text };
    } catch (error: any) {
      const errorMsg = error.message || 'فشل الاتصال';
      await this.prisma.geminiApiKey.update({
        where: { id },
        data: { lastError: errorMsg.substring(0, 500) },
      });
      return { success: false, error: errorMsg };
    }
  }
}
