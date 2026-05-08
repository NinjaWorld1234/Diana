import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 جاري مزامنة الصور المفقودة...');

  const nodes = await prisma.conceptNode.findMany({
    orderBy: { order: 'asc' },
  });

  if (nodes.length < 11) {
    console.log('⚠️ لم يتم العثور على جميع العقد المفاهيمية. تأكد من أن قاعدة البيانات محدثة.');
    return;
  }

  const figuresData = [
    { figureNumber: 1, captionAr: 'التفاعلات الطاردة والماصة للطاقة', imageUrl: '/images/content/image1.png', nodeId: nodes[1].id },
    { figureNumber: 2, captionAr: 'رمز التفاعل الطارد', imageUrl: '/images/content/image2.png', nodeId: nodes[1].id },
    { figureNumber: 3, captionAr: 'رمز التفاعل الماص', imageUrl: '/images/content/image3.png', nodeId: nodes[1].id },
    { figureNumber: 4, captionAr: 'المحتوى الحراري والتغير فيه', imageUrl: '/images/content/image4.png', nodeId: nodes[2].id },
    { figureNumber: 5, captionAr: 'رسم بياني - تفاعل طارد', imageUrl: '/images/content/image5.png', nodeId: nodes[2].id },
    { figureNumber: 6, captionAr: 'رسم بياني - تفاعل ماص', imageUrl: '/images/content/image6.png', nodeId: nodes[2].id },
    { figureNumber: 7, captionAr: 'المعادلة الكيميائية الحرارية', imageUrl: '/images/content/image7.png', nodeId: nodes[3].id },
    { figureNumber: 8, captionAr: 'تحلل كربونات الكالسيوم', imageUrl: '/images/content/image8.png', nodeId: nodes[3].id },
    { figureNumber: 9, captionAr: 'المعادلة الحرارية - مثال', imageUrl: '/images/content/image9.png', nodeId: nodes[3].id },
    { figureNumber: 10, captionAr: 'طاقة الرابطة الكيميائية', imageUrl: '/images/content/image10.png', nodeId: nodes[4].id },
    { figureNumber: 11, captionAr: 'استخدام المعادلة الحرارية في الحسابات', imageUrl: '/images/content/image11.png', nodeId: nodes[6].id },
    { figureNumber: 12, captionAr: 'حساب الطاقة من المعادلة الحرارية', imageUrl: '/images/content/image12.png', nodeId: nodes[6].id },
    { figureNumber: 13, captionAr: 'حرارة الاحتراق', imageUrl: '/images/content/image13.png', nodeId: nodes[7].id },
    { figureNumber: 14, captionAr: 'القيمة الحرارية للغذاء', imageUrl: '/images/content/image14.png', nodeId: nodes[8].id },
    { figureNumber: 15, captionAr: 'التطبيقات الحياتية', imageUrl: '/images/content/image15.png', nodeId: nodes[9].id },
    { figureNumber: 16, captionAr: 'الكيمياء الخضراء', imageUrl: '/images/content/image16.png', nodeId: nodes[10].id },
  ];

  let added = 0;
  for (const fig of figuresData) {
    // تحقق إذا كانت الصورة موجودة مسبقاً لهذه العقدة
    const exists = await prisma.figureReference.findFirst({
      where: { nodeId: fig.nodeId, imageUrl: fig.imageUrl },
    });

    if (!exists) {
      await prisma.figureReference.create({ data: fig });
      added++;
      console.log(`✅ تمت إضافة الصورة: ${fig.imageUrl}`);
    }
  }

  console.log(`🎉 اكتملت المزامنة! تم إضافة ${added} صورة جديدة.`);
}

main()
  .catch((e) => {
    console.error('❌ حدث خطأ أثناء المزامنة:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
