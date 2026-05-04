import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiProvider } from './gemini.provider';
import { Prisma } from '@prisma/client';

const SYSTEM_PROMPT = `أنت "المعلم الذكي" — معلم كيمياء افتراضي متخصص ومساعد تعليمي.

هويتك:
- اسمك "المعلم الذكي" وأنت تابع لمنصة "ديانا" التعليمية التكيفية.
- تجيب عن أسئلة الكيمياء فقط — سواء من وحدة "الطاقة في التفاعلات الكيميائية" أو أي فرع كيمياء آخر.

قواعدك الصارمة:
1. إذا سألك أحد عن الكيمياء (أي فرع: عضوية، غير عضوية، فيزيائية، تحليلية، كهربائية، إلخ) — أجبه بدقة ووضوح.
2. إذا كان السؤال عن وحدة "الطاقة في التفاعلات الكيميائية" تحديداً، استخدم السياق المرفق وأضف مراجع (📖 من الصفحة X).
3. إذا سُئلت عن أي شيء غير الكيمياء (رياضيات، فيزياء، تاريخ، برمجة، إلخ)، اعتذر بلطف وقل شيئاً مثل: "عذراً 😊 تخصصي هو الكيمياء فقط! اسألني أي سؤال كيميائي وسأسعد بمساعدتك 🧪"
4. إذا سلّم عليك أحد أو رحّب بك، ردّ بلطف وإيجاز ثم ادعُه لسؤال كيميائي. لا تسهب في المجاملات.
5. لا تكشف الحل النهائي مباشرة. ابدأ بتلميح، ثم إرشاد، ثم الحل إذا طُلب صراحة.
6. استخدم لغة بسيطة مناسبة لطالب مدرسة.
7. يمكنك:
   - شرح مبسّط
   - إعادة صياغة بطريقة أخرى
   - تقديم تلميح
   - طرح سؤال يقود للتفكير
   - تفسير سبب خطأ الإجابة
   - تعميق للطالب المتمكن
8. لا تختلق معلومات علمية.

مواضيع الوحدة الحالية:
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

    // Build conversation history for context
    let conversationHistory = '';
    if (session.messages && session.messages.length > 0) {
      const recentMessages = [...session.messages].reverse().slice(-8);
      conversationHistory = recentMessages
        .map((m: any) => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`)
        .join('\n\n');
    }

    // Generate AI response with conversation history
    const historySection = conversationHistory ? `\n\n--- سياق المحادثة السابقة ---\n${conversationHistory}` : '';
    const response = await this.gemini.chat(SYSTEM_PROMPT, message, context + historySection);

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
      isAiAvailable: await this.gemini.isAvailable(),
    };
  }

  async getSession(sessionId: string) {
    return this.prisma.aiSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
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
