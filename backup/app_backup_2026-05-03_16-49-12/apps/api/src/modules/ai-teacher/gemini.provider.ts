import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  isAvailable(): boolean {
    return !!this.model;
  }

  async chat(systemPrompt: string, userMessage: string, context: string): Promise<string> {
    if (!this.model) {
      return this.mockResponse(userMessage);
    }

    try {
      const fullPrompt = `${systemPrompt}\n\n--- السياق العلمي ---\n${context}\n\n--- رسالة الطالب ---\n${userMessage}`;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API Error:', error.message);
      return this.mockResponse(userMessage);
    }
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
    if (msg.includes('كمادة') || msg.includes('كماد')) {
      return 'الكمادات الطبية تعتمد على التفاعلات الكيميائية:\n\n🔴 الكمادة الساخنة: تستخدم كلوريد الكالسيوم (CaCl₂) الذي يذوب في الماء بتفاعل طارد يرفع الحرارة من 20°س إلى 90°س.\n\n🔵 الكمادة الباردة: تستخدم نترات الأمونيوم (NH₄NO₃) التي تذوب في الماء بتفاعل ماص يخفض الحرارة من 20°س إلى 0°س.\n\n📖 من الصفحة 116 من الوحدة';
    }

    return 'أنا المعلم الذكي لوحدة الطاقة في التفاعلات الكيميائية. يمكنني مساعدتك في:\n\n• تغيرات الطاقة في التفاعلات\n• المحتوى الحراري ΔH\n• المعادلة الكيميائية الحرارية\n• طاقة الرابطة\n• حساب حرارة التفاعل\n• حرارة الاحتراق والوقود\n• القيمة الحرارية للغذاء\n• التطبيقات الحياتية (الكمادات)\n\nاسألني عن أي موضوع من هذه المواضيع! 🧪';
  }
}
