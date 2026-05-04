import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async isAvailable(): Promise<boolean> {
    // Check if we have at least one active key in DB
    const dbKeyCount = await this.prisma.geminiApiKey.count({ where: { isActive: true } });
    if (dbKeyCount > 0) return true;
    // Fallback to env variable
    const envKey = this.config.get('GEMINI_API_KEY');
    return !!(envKey && envKey !== 'your-gemini-api-key');
  }

  async chat(systemPrompt: string, userMessage: string, context: string): Promise<string> {
    // Get all active keys sorted by priority
    const dbKeys = await this.prisma.geminiApiKey.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    // If no DB keys, try env variable as fallback
    if (dbKeys.length === 0) {
      const envKey = this.config.get('GEMINI_API_KEY');
      if (envKey && envKey !== 'your-gemini-api-key') {
        return this.callGemini(envKey, systemPrompt, userMessage, context);
      }
      return this.mockResponse(userMessage);
    }

    // Try each key in order until one works
    for (const keyRecord of dbKeys) {
      try {
        const result = await this.callGemini(keyRecord.apiKey, systemPrompt, userMessage, context);
        
        // Update usage stats on success
        await this.prisma.geminiApiKey.update({
          where: { id: keyRecord.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            lastError: null,
          },
        });

        return result;
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        this.logger.warn(`Key "${keyRecord.label}" failed: ${errorMsg}. Trying next key...`);

        // Mark this key with the error but keep it active (might be temporary)
        await this.prisma.geminiApiKey.update({
          where: { id: keyRecord.id },
          data: {
            lastError: errorMsg.substring(0, 500),
            // If quota exceeded, deactivate
            isActive: errorMsg.includes('429') || errorMsg.includes('quota') ? false : true,
          },
        });
      }
    }

    // All keys failed
    this.logger.error('All Gemini API keys exhausted! Using mock response.');
    return this.mockResponse(userMessage);
  }

  private async callGemini(apiKey: string, systemPrompt: string, userMessage: string, context: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const fullPrompt = `${systemPrompt}\n\n--- السياق العلمي ---\n${context}\n\n--- رسالة الطالب ---\n${userMessage}`;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

  private mockResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('طارد') || msg.includes('ماص')) {
      return 'التفاعل الطارد يُطلق طاقة (حرارة) إلى المحيط مما يرفع درجة حرارته، بينما التفاعل الماص يمتص طاقة من المحيط مما يخفض درجة حرارته. مثال على الطارد: احتراق الميثان. مثال على الماص: تحلل كربونات الكالسيوم.\n\n📖 من الصفحة 103-104 من الوحدة';
    }
    if (msg.includes('ΔH') || msg.includes('محتوى حراري')) {
      return 'المحتوى الحراري (ΔH) هو الفرق بين المحتوى الحراري للنواتج والمتفاعلات.\n\nΔH = المحتوى الحراري للنواتج - المحتوى الحراري للمتفاعلات\n\nإذا كانت ΔH سالبة: التفاعل طارد للحرارة.\nإذا كانت ΔH موجبة: التفاعل ماص للحرارة.\n\n📖 من الصفحة 104-105 من الوحدة';
    }
    if (msg.includes('رابطة') || msg.includes('كسر') || msg.includes('تكوين')) {
      return 'طاقة الرابطة هي الطاقة اللازمة لكسر مول واحد من الروابط.\n\n• كسر الروابط → يحتاج طاقة (امتصاص)\n• تكوين الروابط → يُطلق طاقة (انبعاث)\n\nΔH = مجموع طاقات الروابط المكسورة - مجموع طاقات الروابط المتكونة\n\n📖 من الصفحة 107-108 من الوحدة';
    }
    if (msg.includes('احتراق') || msg.includes('وقود')) {
      return 'حرارة الاحتراق هي كمية الحرارة الناتجة من احتراق مول واحد من المادة احتراقًا تامًا.\n\nتُستخدم للمقارنة بين أنواع الوقود. مثلاً:\n• الميثان: 890 كيلو جول/مول\n• الإيثان: 1560 كيلو جول/مول\n• الهيدروجين: 286 كيلو جول/مول\n\n📖 من الصفحة 111-112 من الوحدة';
    }

    return 'أنا المعلم الذكي لوحدة الطاقة في التفاعلات الكيميائية. يمكنني مساعدتك في:\n\n• تغيرات الطاقة في التفاعلات\n• المحتوى الحراري ΔH\n• المعادلة الكيميائية الحرارية\n• طاقة الرابطة\n• حساب حرارة التفاعل\n• حرارة الاحتراق والوقود\n• القيمة الحرارية للغذاء\n• التطبيقات الحياتية (الكمادات)\n\nاسألني عن أي موضوع من هذه المواضيع! 🧪';
  }
}
