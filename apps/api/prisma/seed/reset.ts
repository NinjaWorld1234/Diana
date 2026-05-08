import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 جاري تصفير تقدم حساب الطالب التجريبي...');

  const student = await prisma.user.findUnique({
    where: { email: 'student@diana.edu' },
  });

  if (student) {
    // حذف جميع سجلات التقدم السابقة للطالب
    await prisma.nodeProgress.deleteMany({
      where: { userId: student.id },
    });

    // استخراج العقدة الأولى فقط
    const firstNode = await prisma.conceptNode.findFirst({
      orderBy: { order: 'asc' },
    });

    if (firstNode) {
      // فتح العقدة الأولى فقط
      await prisma.nodeProgress.create({
        data: { userId: student.id, nodeId: firstNode.id, status: 'IN_PROGRESS' },
      });
      console.log('✅ تم إعادة تعيين تقدم الطالب بنجاح! العقدة الأولى فقط أصبحت مفتوحة الآن.');
    }
  } else {
    console.log('⚠️ لم يتم العثور على حساب الطالب التجريبي (student@diana.edu).');
  }
}

main()
  .catch((e) => {
    console.error('❌ حدث خطأ:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
