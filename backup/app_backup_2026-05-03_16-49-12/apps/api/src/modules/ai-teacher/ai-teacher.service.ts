import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiProvider } from './gemini.provider';
import { Prisma } from '@prisma/client';

const SYSTEM_PROMPT = `أنت "المعلم الذكي" — معلم كيمياء افتراضي متخصص في وحدة "الطاقة في التفاعلات الكيميائية" للصف العاشر الأساسي.

قواعدك الصارمة:
1. أجب فقط ضمن محتوى الوحدة المرفقة. لا تخرج عن نطاقها أبداً.
2. إذا سُئلت عن موضوع خارج هذه الوحدة، اعتذر بلطف وقل: "هذا السؤال خارج نطاق وحدة الطاقة في التفاعلات الكيميائية. يمكنني مساعدتك في مواضيع الوحدة فقط."
3. لا تكشف الحل النهائي مباشرة. ابدأ بتلميح، ثم إرشاد، ثم الحل إذا طُلب صراحة.
4. استخدم لغة بسيطة مناسبة لطالب صف عاشر.
5. أضف مراجع (من الصفحة X) عندما تستشهد بمحتوى من الوحدة.
6. يمكنك:
   - شرح مبسّط
   - إعادة صياغة بطريقة أخرى
   - تقديم تلميح
   - طرح سؤال يقود للتفكير
   - تفسير سبب خطأ الإجابة
   - تعميق للطالب المتمكن
7. لا تختلق معلومات علمية. كل ما تذكره يجب أن يكون من محتوى الوحدة.

مواضيع الوحدة:
- تغيرات الطاقة (طاردة وماصة)
- المحتوى الحراري ΔH
- المعادلة الكيميائية الحرارية
- طاقة الرابطة (كسر وتكوين)
- حساب حرارة التفاعل باستخدام طاقة الروابط
- استخدام المعادلة الحرارية في الحسابات
- حرارة الاحتراق والوقود
- القيمة الحرارية للغذاء
- التطبيقات الحياتية (الكمادات، السعرات)`;

@Injectable()
export class AiTeacherService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiProvider,
  ) {}

  async chat(userId: string, sessionId: string | null, nodeId: string | null, message: string) {
    // Get or create session
    let session: any;
    if (sessionId) {
      session = await this.prisma.aiSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });
    }
    if (!session) {
      session = await this.prisma.aiSession.create({
        data: { userId, nodeId },
      });
    }

    // Save user message
    await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: 'user', content: message },
    });

    // Get relevant context from content chunks
    let context = '';
    if (nodeId) {
      const chunks = await this.prisma.contentChunk.findMany({
        where: { nodeId },
        orderBy: { order: 'asc' },
        take: 20,
      });
      context = chunks.map((c) => c.textAr).join('\n\n');

      // Add formulas
      const formulas = await this.prisma.formula.findMany({ where: { nodeId } });
      if (formulas.length > 0) {
        context += '\n\nالمعادلات والقوانين:\n' + formulas.map((f) => `${f.descriptionAr}: ${f.expression}`).join('\n');
      }

      // Add tables
      const tables = await this.prisma.tableReference.findMany({ where: { nodeId } });
      if (tables.length > 0) {
        context += '\n\nالجداول:\n' + tables.map((t) => `${t.captionAr}: ${JSON.stringify(t.dataJson)}`).join('\n');
      }
    } else {
      // General context — get all nodes' content
      const allChunks = await this.prisma.contentChunk.findMany({
        orderBy: { order: 'asc' },
        take: 30,
      });
      context = allChunks.map((c) => c.textAr).join('\n\n');
    }

    // Generate AI response
    const response = await this.gemini.chat(SYSTEM_PROMPT, message, context);

    // Save assistant message
    await this.prisma.aiMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: response,
        citationsJson: nodeId ? { nodeId } : Prisma.JsonNull,
      },
    });

    return {
      sessionId: session.id,
      message: response,
      isAiAvailable: this.gemini.isAvailable(),
    };
  }

  async getSessionHistory(sessionId: string) {
    return this.prisma.aiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.aiSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }
}
