import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء عملية ملء قاعدة البيانات...');

  // ─── Cleanup: حذف البيانات القديمة ─────────
  console.log('🧹 تنظيف البيانات القديمة...');
  await prisma.questionAttempt.deleteMany();
  await prisma.masterySnapshot.deleteMany();
  await prisma.nodeProgress.deleteMany();
  await prisma.hint.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.formula.deleteMany();
  await prisma.tableReference.deleteMany();
  await prisma.figureReference.deleteMany();
  await prisma.contentChunk.deleteMany();
  await prisma.remediationCard.deleteMany();
  await prisma.subConcept.deleteMany();
  await prisma.conceptNode.deleteMany();
  await prisma.sourceDocument.deleteMany();
  await prisma.unit.deleteMany();
  console.log('✅ تم التنظيف.');

  // ─── Users ────────────────────────────────
  console.log('👤 إنشاء المستخدمين...');
  const adminHash = await bcrypt.hash('admin123', 12);
  const studentHash = await bcrypt.hash('student123', 12);
  const teacherHash = await bcrypt.hash('teacher123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@diana.edu' },
    update: {},
    create: { email: 'admin@diana.edu', name: 'مدير النظام', passwordHash: adminHash, role: 'ADMIN' },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@diana.edu' },
    update: {},
    create: { email: 'teacher@diana.edu', name: 'أ. سارة', passwordHash: teacherHash, role: 'TEACHER' },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@diana.edu' },
    update: {},
    create: { email: 'student@diana.edu', name: 'أحمد', passwordHash: studentHash, role: 'STUDENT' },
  });

  // ─── Unit ─────────────────────────────────
  console.log('📚 إنشاء الوحدة...');
  const unit = await prisma.unit.create({
    data: {
      titleAr: 'الطاقة في التفاعلات الكيميائية',
      descriptionAr: 'الوحدة الخامسة: تتناول تغيرات الطاقة المصاحبة للتفاعلات الكيميائية، وتصنيف التفاعلات إلى طاردة وماصة للطاقة، والمحتوى الحراري، وطاقة الرابطة، وحساب حرارة التفاعل، وحرارة الاحتراق، والقيمة الحرارية للوقود والغذاء، والتطبيقات الحياتية.',
      order: 5,
    },
  });

  // ─── Source Documents ─────────────────────
  console.log('📄 إنشاء مراجع المصادر...');
  const pdfDoc = await prisma.sourceDocument.create({
    data: { filename: 'chm10.pdf', type: 'PDF', unitId: unit.id },
  });
  const docxDoc = await prisma.sourceDocument.create({
    data: { filename: 'وثيقة التصميم الشاملة لبرمجية.docx', type: 'DOCX', unitId: unit.id },
  });
  const imgDoc = await prisma.sourceDocument.create({
    data: { filename: '22.jpeg', type: 'IMAGE', unitId: unit.id },
  });

  // ─── Concept Nodes (10 nodes) ─
  console.log('🗺️ إنشاء العقد المفاهيمية...');
  const nodesData = [
    {
      titleAr: 'تغيّرات الطاقة في التفاعلات الكيميائية',
      descriptionAr: 'أن يفهم الطالب أن التفاعلات الكيميائية قد يصاحبها تغير في الطاقة',
      introductionAr: 'تشكّل الطاقة عصب الحياة، حيث تحتاجها قطاعات المجتمع المختلفة كافة في تسيير الحياة اليومية. وللتفاعلات الكيميائية علاقة بالطاقة بأشكالها المختلفة، إذ قد يصاحب التفاعل انطلاق طاقة أو امتصاصها، وقد تظهر الطاقة على شكل حرارة أو ضوء.',
      order: 1, icon: 'zap', color: '#F59E0B',
    },
    {
      titleAr: 'التفاعلات الطاردة والماصة للطاقة',
      descriptionAr: 'أن يميز الطالب بين التفاعل الطارد للطاقة والتفاعل الماص للطاقة',
      introductionAr: 'تقسم التفاعلات إلى قسمين من حيث التغيّرات في الطاقة المصاحبة للتفاعل: تفاعلات طاردة للطاقة تعطي طاقة عند حدوثها، وتفاعلات ماصة للطاقة تحتاج إلى طاقة لحدوثها.',
      order: 2, icon: 'flame', color: '#EF4444',
      videoUrls: [
        { url: 'https://www.youtube.com/watch?v=H2Bml7UnHSk', label: 'فيديو التفاعل الطارد للطاقة' },
        { url: 'https://www.youtube.com/watch?v=IuCf-B1_g88', label: 'فيديو التفاعل الماص للطاقة' },
      ],
      imageUrls: [
        { url: '/assets/node2-comparison.png', caption: 'مقارنة بين التفاعل الطارد والماص للطاقة', context: 'content' },
      ],
    },
    {
      titleAr: 'المحتوى الحراري والتغير في المحتوى الحراري ΔH',
      descriptionAr: 'أن يفهم الطالب أن ΔH يمثل الفرق بين المحتوى الحراري للمتفاعلات والنواتج',
      introductionAr: 'المحتوى الحراري (H) هو تعبير عن الطاقة المخزّنة في المادة. عند حدوث التفاعل الكيميائي يصاحبه تكسير روابط وتكوين روابط جديدة، فيتغير المحتوى الحراري للمواد. التغيُّر في المحتوى الحراري يُسمى حرارة التفاعل ويُرمز له بالرمز ΔH.',
      order: 3, icon: 'thermometer', color: '#3B82F6',
      imageUrls: [
        { url: '/assets/node3-graph.png', caption: 'الرسم البياني لمنحنى الطاقة (طارد/ماص)', context: 'content' },
      ],
    },
    {
      titleAr: 'المعادلة الكيميائية الحرارية',
      descriptionAr: 'أن يعرف الطالب معنى المعادلة الكيميائية الحرارية ودلالة ΔH فيها',
      introductionAr: 'تُسمّى المعادلة الكيميائية الموزونة التي يُشار فيها إلى كمية الحرارة المصاحبة للتفاعل الكيميائي بالمعادلة الكيميائية الحرارية. الإشارة السالبة تعني تفاعلاً طارداً والإشارة الموجبة تعني تفاعلاً ماصاً.',
      order: 4, icon: 'file-text', color: '#8B5CF6',
      imageUrls: [
        { url: '/assets/node4-thermal.png', caption: 'أمثلة على المعادلات الكيميائية الحرارية', context: 'content' },
      ],
    },
    {
      titleAr: 'طاقة الرابطة الكيميائية',
      descriptionAr: 'أن يفهم الطالب معنى طاقة الرابطة وعلاقة كسر الروابط وتكوينها بالطاقة',
      introductionAr: 'طاقة الرابطة هي الطاقة اللازمة لكسر مول واحد من الروابط. كسر الروابط يحتاج طاقة (عملية ماصة)، وتكوين الروابط يُطلق طاقة (عملية طاردة). كلما زادت طاقة الرابطة دلّ ذلك على قوتها.',
      order: 5, icon: 'link', color: '#06B6D4',
    },
    {
      titleAr: 'حساب حرارة التفاعل باستخدام طاقة الروابط',
      descriptionAr: 'أن يطبق الطالب قانون حساب حرارة التفاعل باستخدام طاقات الروابط',
      introductionAr: 'يُستفاد من طاقة الروابط في حساب قيمة الطاقة المصاحبة للتفاعلات الكيميائية في الحالة الغازية، وفق العلاقة:\\nΔH = مجموع طاقات الروابط المكسِّرة - مجموع طاقات الروابط المتكوِّنة',
      order: 6, icon: 'calculator', color: '#10B981',
    },
    {
      titleAr: 'استخدام المعادلة الحرارية في الحسابات',
      descriptionAr: 'أن يربط الطالب بين عدد المولات وكمية الطاقة الناتجة أو الممتصة',
      introductionAr: 'المعادلة الحرارية تعطي علاقة بين كمية المادة والحرارة المصاحبة. يمكن استخدام النسبة والتناسب أو المولات لحساب الطاقة لكمية مختلفة من المادة.',
      order: 7, icon: 'sigma', color: '#F97316',
    },
    {
      titleAr: 'حرارة الاحتراق والوقود',
      descriptionAr: 'أن يعرف الطالب معنى حرارة الاحتراق ويستخدمها للمقارنة بين أنواع الوقود',
      introductionAr: 'يُعَدّ النفط والفحم الحجري والغاز الطبيعي من المصادر الرئيسة للطاقة. حرارة الاحتراق هي كمية الحرارة الناتجة عن حرق مول واحد من المادة حرقاً تاماً، وتُقاس بالكيلو جول/مول. القيمة الحرارية هي كمية الحرارة الناتجة من حرق غرام واحد.',
      order: 8, icon: 'fuel', color: '#DC2626',
    },
    {
      titleAr: 'القيمة الحرارية للغذاء',
      descriptionAr: 'أن يربط الطالب بين الغذاء والطاقة التي يمد بها الجسم',
      introductionAr: 'الغذاء مصدر للطاقة. تختلف القيمة الحرارية من نوع غذائي إلى آخر. السعر الحراري = 4.18 جول. الكربوهيدرات (4.07 سعر/غم)، الدهون (9.08 سعر/غم)، البروتين (4.07 سعر/غم).',
      order: 9, icon: 'utensils', color: '#84CC16',
      imageUrls: [
        { url: '/assets/node9-food-table.png', caption: 'جدول القيمة الحرارية لأنواع الغذاء والوقود', context: 'content' },
      ],
    },
    {
      titleAr: 'التطبيقات الحياتية والمشروع',
      descriptionAr: 'أن يربط الطالب بين مفاهيم الوحدة وتطبيقاتها في الحياة اليومية',
      introductionAr: 'تشمل التطبيقات الحياتية: الكمادات الساخنة (كلوريد الكالسيوم CaCl₂ — تفاعل طارد يرفع الحرارة من 20°س إلى 90°س) والكمادات الباردة (نترات الأمونيوم NH₄NO₃ — تفاعل ماص يخفض الحرارة من 20°س إلى 0°س)، ومشروع البرنامج الغذائي الأسبوعي.',
      order: 10, icon: 'heart-pulse', color: '#EC4899',
      imageUrls: [
        { url: '/assets/node10-pads.png', caption: 'الكمادات الساخنة والباردة — تطبيقات الطاقة', context: 'content' },
        { url: '/assets/green-chemistry.png', caption: 'الكيمياء الخضراء واقتصاد الذرة', context: 'content' },
      ],
    },
  ];

  const nodes: any[] = [];
  for (const nodeData of nodesData) {
    const node = await prisma.conceptNode.create({
      data: { ...nodeData, unitId: unit.id },
    });
    nodes.push(node);
  }

  // ─── Content Chunks ───────────────────────
  console.log('📝 إنشاء المحتوى العلمي...');
  const contentData = [
    // Node 1: تغيرات الطاقة
    { nodeId: nodes[0].id, textAr: 'تشكّل الطاقة عصب الحياة، حيث تحتاجها قطاعات المجتمع المختلفة. وللتفاعلات الكيميائية علاقة بالطاقة بأشكالها المختلفة.', type: 'EXPLANATION', order: 1 },
    { nodeId: nodes[0].id, textAr: 'تعتمد الطاقة الكيميائية المخزونة على نوع الذرّات والروابط الكيميائية بينها، وترتيبها في المادة.', type: 'EXPLANATION', order: 2 },
    { nodeId: nodes[0].id, textAr: 'في التفاعلات الكيميائية يتغير ترتيب الذرّات أو تتغير الروابط بينها، وتبعاً لذلك، ستتغير كمية الطاقة المخزونة إما بالزيادة أو النقصان، بحيث تبقى كمية الطاقة الكلية قبل التفاعل تساوي كمية الطاقة بعد التفاعل وَفْق قانون حفظ الطاقة.', type: 'LAW', order: 3 },

    // Node 2: الطاردة والماصة
    { nodeId: nodes[1].id, textAr: 'التفاعلات الطاردة للطاقة: هي التفاعلات التي تعطي طاقة عند حدوثها، ومن أمثلتها تفاعل التعادل من إضافة حمض الهيدروكلوريك (HCl) إلى محلول هيدروكسيد الصوديوم (NaOH).', type: 'DEFINITION', order: 1 },
    { nodeId: nodes[1].id, textAr: 'التفاعلات الماصة للطاقة: هي التفاعلات التي تحتاج إلى طاقة لحدوثها وتستمدها من مصدر خارجي أو من البيئة المحيطة، ومن أمثلة ذلك تحلل كربونات الكالسيوم بالحرارة لتكوين أكسيد الكالسيوم وغاز ثاني أكسيد الكربون.', type: 'DEFINITION', order: 2 },

    // Node 3: المحتوى الحراري
    { nodeId: nodes[2].id, textAr: 'المحتوى الحراري (H) هو تعبير عن الطاقة المخزّنة في المادة، سواء كانت متفاعلة أو ناتجة.', type: 'DEFINITION', order: 1 },
    { nodeId: nodes[2].id, textAr: 'ΔH = المحتوى الحراري للمواد الناتجة - المحتوى الحراري للمواد المتفاعلة', type: 'LAW', order: 2 },
    { nodeId: nodes[2].id, textAr: 'إذا كان ΔH سالباً: التفاعل طارد للحرارة (المحتوى الحراري للنواتج أقل من المتفاعلات).\nإذا كان ΔH موجباً: التفاعل ماص للحرارة (المحتوى الحراري للنواتج أعلى من المتفاعلات).', type: 'EXPLANATION', order: 3 },

    // Node 4: المعادلة الحرارية
    { nodeId: nodes[3].id, textAr: 'المعادلة الكيميائية الحرارية: هي المعادلة الكيميائية الموزونة التي يُشار فيها إلى كمية الحرارة المصاحبة للتفاعل الكيميائي.', type: 'DEFINITION', order: 1 },
    { nodeId: nodes[3].id, textAr: 'مثال: 2H₂(g) + O₂(g) → 2H₂O(l) + 572 KJ\nأو: 2H₂(g) + O₂(g) → 2H₂O(l)  ΔH = -572 KJ', type: 'EXAMPLE', order: 2 },
    { nodeId: nodes[3].id, textAr: 'الإشارة السالبة في ΔH تعني أن التفاعل طارد للطاقة (خروج طاقة من النظام). الإشارة الموجبة تعني تفاعلاً ماصاً (دخول طاقة إلى النظام).', type: 'EXPLANATION', order: 3 },

    // Node 5: طاقة الرابطة
    { nodeId: nodes[4].id, textAr: 'طاقة الرابطة: هي الطاقة اللازمة لكسر مول واحد من الروابط الكيميائية.', type: 'DEFINITION', order: 1 },
    { nodeId: nodes[4].id, textAr: 'كسر الروابط يمتص طاقة (ΔH موجبة).\nتكوين الروابط يُطلق طاقة (ΔH سالبة).', type: 'LAW', order: 2 },
    { nodeId: nodes[4].id, textAr: 'مثال: طاقة رابطة H-H = 436 كيلو جول/مول\nH₂(g) + 436 KJ → H(g) + H(g)', type: 'EXAMPLE', order: 3 },

    // Node 6: حساب حرارة التفاعل
    { nodeId: nodes[5].id, textAr: 'ΔH = مجموع طاقات الروابط المكسّرة - مجموع طاقات الروابط المتكوِّنة', type: 'LAW', order: 1 },
    { nodeId: nodes[5].id, textAr: 'مثال 1: H₂(g) + F₂(g) → 2HF(g)\nالروابط المكسّرة: H-H (436) + F-F (158) = 594 kJ\nالروابط المتكوّنة: 2 × H-F (565) = 1130 kJ\nΔH = 594 - 1130 = -536 kJ (طارد)', type: 'EXAMPLE', order: 2 },
    { nodeId: nodes[5].id, textAr: 'مثال 2: CH₄(g) + 2O₂(g) → 2H₂O(g) + CO₂(g)\nالروابط المكسّرة: 4×C-H (413) + 2×O=O (498) = 2648 kJ\nالروابط المتكوّنة: 4×H-O (464) + 2×C=O (724) = 3304 kJ\nΔH = 2648 - 3304 = -656 kJ (طارد)', type: 'EXAMPLE', order: 3 },

    // Node 7: استخدام المعادلة
    { nodeId: nodes[6].id, textAr: 'يمكن استخدام المعادلة الحرارية لحساب كمية الطاقة عند تفاعل كميات مختلفة من المواد باستخدام النسبة والتناسب.', type: 'EXPLANATION', order: 1 },
    { nodeId: nodes[6].id, textAr: 'مثال: يستهلك أحد المطاعم 5 أطنان سنوياً من الفحم.\nC(s) + O₂(g) → CO₂(g) + 394 KJ\nعدد مول الكربون = 5,000,000 ÷ 12 = 416,666.7 mol\nالطاقة = 416,666.7 × 394 = 164,166,679.8 kJ', type: 'EXAMPLE', order: 2 },
    { nodeId: nodes[6].id, textAr: 'القيمة الحرارية: هي كمية الحرارة الناتجة من حرق غرام واحد من المادة حرقاً تاماً. تُستخدم للتمييز بين أنواع الوقود المختلفة. فمثلاً: الهيدروجين له أعلى قيمة حرارية (141.8 kJ/g) مقارنة بالميثان (55.5 kJ/g) والفحم (32.8 kJ/g).', type: 'EXPLANATION', order: 3 },

    // Node 8: حرارة الاحتراق
    { nodeId: nodes[7].id, textAr: 'حرارة الاحتراق: هي كمية الحرارة الناتجة عن حرق مول واحد من المادة حرقاً تاماً في كمية كافية من الأكسجين. تُقاس بالكيلو جول/مول.', type: 'DEFINITION', order: 1 },
    { nodeId: nodes[7].id, textAr: 'القيمة الحرارية: كمية الحرارة الناتجة من حرق غرام واحد من المادة حرقاً تاماً. تُعدّ أحد العوامل التي يُعتمد عليها في التمييز بين أنواع الوقود.', type: 'DEFINITION', order: 2 },
    { nodeId: nodes[7].id, textAr: 'العلاقة بين حرارة الاحتراق والقيمة الحرارية:\nالقيمة الحرارية = حرارة الاحتراق ÷ الكتلة المولية\nمثال: حرارة احتراق الميثان = 890 kJ/mol\nالكتلة المولية = 16 g/mol\nالقيمة الحرارية = 890 ÷ 16 = 55.6 kJ/g', type: 'EXAMPLE', order: 3 },

    // Node 9: القيمة الحرارية للغذاء
    { nodeId: nodes[8].id, textAr: 'الغذاء مصدر للطاقة. تختلف القيمة الحرارية من نوع غذائي إلى آخر. السعر الحراري = 4.18 جول.', type: 'EXPLANATION', order: 1 },
    { nodeId: nodes[8].id, textAr: 'جدول القيمة الحرارية للغذاء:\nكربوهيدرات: 4.07 سعر/غم\nدهون: 9.08 سعر/غم\nبروتين: 4.07 سعر/غم\nخبز: 2.87 سعر/غم\nعسل: 3.18 سعر/غم', type: 'NOTE', order: 2 },
    { nodeId: nodes[8].id, textAr: 'تحويل السعرات الحرارية إلى جول:\n1 سعر حراري = 4.18 جول\nمثال: إذا كانت وجبة تحتوي 500 سعرة حرارية:\nالطاقة بالجول = 500 × 4.18 = 2090 جول = 2.09 كيلو جول', type: 'EXAMPLE', order: 3 },

    // Node 10: التطبيقات
    { nodeId: nodes[9].id, textAr: 'الكمادة الساخنة: تستخدم كلوريد الكالسيوم (CaCl₂) الذي يذوب في الماء بتفاعل طارد يرفع الحرارة من 20°س إلى 90°س.\nCaCl₂(s) + H₂O(l) → CaCl₂·6H₂O(aq) + حرارة', type: 'EXAMPLE', order: 1 },
    { nodeId: nodes[9].id, textAr: 'الكمادة الباردة: تستخدم نترات الأمونيوم (NH₄NO₃) التي تذوب في الماء بتفاعل ماص يخفض الحرارة من 20°س إلى 0°س.\nNH₄NO₃(s) + H₂O(l) + حرارة → NH₄NO₃(aq)', type: 'EXAMPLE', order: 2 },
    { nodeId: nodes[9].id, textAr: 'تطبيقات عملية على التفاعلات الطاردة والماصة:\n• أكياس التدفئة اليدوية: تستخدم أكسدة الحديد (تفاعل طارد بطيء) لتوليد الحرارة.\n• التبريد الفوري للإصابات: تعتمد على ذوبان أملاح (تفاعل ماص) لخفض الحرارة.\n• الطبخ بالحرارة الكيميائية: تفاعلات طاردة مُتحكَّم بها لتسخين الأغذية.', type: 'EXPLANATION', order: 3 },


  ];

  for (const chunk of contentData) {
    await prisma.contentChunk.create({ data: chunk as any });
  }

  // ─── Formulas ─────────────────────────────
  console.log('📐 إنشاء المعادلات...');
  const formulasData = [
    { nodeId: nodes[2].id, expression: 'ΔH = H(نواتج) - H(متفاعلات)', descriptionAr: 'قانون حساب التغير في المحتوى الحراري' },
    { nodeId: nodes[5].id, expression: 'ΔH = Σ(طاقات الروابط المكسّرة) - Σ(طاقات الروابط المتكوّنة)', descriptionAr: 'قانون حساب حرارة التفاعل من طاقات الروابط' },
    { nodeId: nodes[3].id, expression: '2H₂(g) + O₂(g) → 2H₂O(l)  ΔH = -572 KJ', descriptionAr: 'معادلة تكوين الماء الحرارية' },
    { nodeId: nodes[7].id, expression: 'القيمة الحرارية = حرارة الاحتراق ÷ الكتلة المولية', descriptionAr: 'العلاقة بين حرارة الاحتراق والقيمة الحرارية' },
    { nodeId: nodes[8].id, expression: 'الطاقة = الكتلة × القيمة الحرارية', descriptionAr: 'حساب الطاقة من الغذاء' },
    { nodeId: nodes[8].id, expression: '1 سعر حراري = 4.18 جول', descriptionAr: 'تحويل السعرات إلى جول' },
  ];
  for (const f of formulasData) {
    await prisma.formula.create({ data: f });
  }

  // ─── Tables ───────────────────────────────
  console.log('📊 إنشاء الجداول...');
  await prisma.tableReference.create({
    data: {
      tableNumber: 1, captionAr: 'جدول 5-1: قيم طاقات بعض الروابط الكيميائية بالكيلو جول/مول', nodeId: nodes[4].id,
      dataJson: {
        headers: ['الرابطة', 'الطاقة (kJ/mol)'],
        rows: [['H-H', 436], ['H-F', 565], ['H-Cl', 431], ['H-Br', 366], ['H-O', 464], ['H-C', 413], ['H-N', 391],
          ['C-C', 347], ['C=C', 614], ['C≡C', 839], ['C-O', 358], ['C=O', 724], ['C-N', 305], ['C≡N', 891],
          ['N-N', 163], ['N=N', 418], ['N≡N', 946], ['O-O', 146], ['O=O', 498], ['F-F', 158], ['Cl-Cl', 242]],
      },
    },
  });

  await prisma.tableReference.create({
    data: {
      tableNumber: 2, captionAr: 'جدول 5-2: حرارة الاحتراق لبعض أنواع الوقود', nodeId: nodes[7].id,
      dataJson: {
        headers: ['الوقود', 'حرارة الاحتراق (kJ/mol)'],
        rows: [['كربون', 394], ['هيدروجين', 286], ['ميثان', 890], ['إيثان', 1560], ['بروبان', 2220], ['بيوتان', 2855], ['إيثانول', 1367]],
      },
    },
  });

  await prisma.tableReference.create({
    data: {
      tableNumber: 3, captionAr: 'جدول 5-3: القيمة الحرارية لبعض أنواع الوقود', nodeId: nodes[7].id,
      dataJson: {
        headers: ['الوقود', 'القيمة الحرارية (kJ/g)'],
        rows: [['فحم خشب', 18], ['فحم حجري', 31], ['بنزين', 45], ['بترول خام', 48], ['غاز طبيعي', 49], ['غاز طبخ', 47.9]],
      },
    },
  });

  await prisma.tableReference.create({
    data: {
      tableNumber: 4, captionAr: 'جدول 5-4: القيمة الحرارية للغذاء بالسُّعر الحراري/غم', nodeId: nodes[8].id,
      dataJson: {
        headers: ['نوع الغذاء', 'القيمة الحرارية (سعر/غم)'],
        rows: [['كربوهيدرات', 4.07], ['دهون', 9.08], ['بروتين', 4.07], ['خبز', 2.87], ['عسل', 3.18]],
      },
    },
  });

  // ─── Questions Bank (100+) ────────────────
  console.log('❓ إنشاء بنك الأسئلة...');

  // Helper to create a question with options
  async function createQuestion(data: any, options: any[]) {
    const q = await prisma.question.create({ data });
    for (let i = 0; i < options.length; i++) {
      await prisma.questionOption.create({
        data: { ...options[i], questionId: q.id, order: i },
      });
    }
    return q;
  }

  // ── Node 1 Questions ──
  await createQuestion(
    { textAr: 'ما المقصود بقولنا إن التفاعل الكيميائي يصاحبه تغير في الطاقة؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[0].id, explanationAr: 'التفاعل الكيميائي قد يُطلق طاقة أو يمتصها نتيجة تغير الروابط بين الذرات.', points: 10 },
    [
      { textAr: 'أن التفاعل يُطلق أو يمتص طاقة نتيجة تغير الروابط الكيميائية', isCorrect: true },
      { textAr: 'أن التفاعل يحتاج حرارة لبدئه فقط', isCorrect: false, explanationAr: 'ليس كل تفاعل يحتاج حرارة. بعض التفاعلات تلقائية.' },
      { textAr: 'أن المواد تتحول من صلبة إلى سائلة', isCorrect: false, explanationAr: 'هذا تغير فيزيائي وليس كيميائياً.' },
      { textAr: 'أن الطاقة لا تتغير أبداً', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'أي مما يلي يدل على حدوث تغير في الطاقة أثناء تفاعل كيميائي؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[0].id, explanationAr: 'ارتفاع درجة الحرارة وظهور ضوء كلاهما دليل على تغير في الطاقة.', points: 10 },
    [
      { textAr: 'ارتفاع درجة الحرارة', isCorrect: false, explanationAr: 'صحيح جزئياً لكن ليس الإجابة الأكمل.' },
      { textAr: 'ظهور ضوء', isCorrect: false },
      { textAr: 'جميع ما ذُكر', isCorrect: true },
      { textAr: 'تغير لون المحلول فقط', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'إذا لاحظ الطالب ظهور ضوء وارتفاعاً في درجة الحرارة أثناء التفاعل، فماذا يستنتج عن وجود تغير في الطاقة؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[0].id, explanationAr: 'ظهور ضوء وحرارة يدل على أن التفاعل أطلق طاقة (طارد للطاقة).', points: 15 },
    [
      { textAr: 'التفاعل أطلق طاقة على شكل حرارة وضوء وهو طارد للطاقة', isCorrect: true },
      { textAr: 'التفاعل لم يحدث فيه تغير', isCorrect: false },
      { textAr: 'التفاعل ماص للطاقة', isCorrect: false, explanationAr: 'التفاعل الماص يمتص طاقة ولا يطلقها.' },
      { textAr: 'لا يمكن الاستنتاج', isCorrect: false },
    ],
  );

  // ── Node 2 Questions ──
  await createQuestion(
    { textAr: 'عند تفاعل هيدروكسيد الباريوم مع كلوريد الأمونيوم، تنخفض حرارة الماء؛ لذا يُصنف بأنه "طارد للحرارة".', type: 'TRUE_FALSE', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[1].id, explanationAr: 'انخفاض درجة حرارة الوسط يعني أن التفاعل امتص حرارة من الوسط، فهو ماصّ وليس طارداً.', points: 10 },
    [
      { textAr: 'صح', isCorrect: false, explanationAr: 'خطأ! انخفاض حرارة الماء يعني أن التفاعل امتص حرارة منه.' },
      { textAr: 'خطأ', isCorrect: true, explanationAr: 'صحيح! هذا تفاعل ماص للحرارة لأن الوسط فقد حرارة.' },
    ],
  );

  await createQuestion(
    { textAr: 'أي التفاعلات التالية طاردة للطاقة؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[1].id, explanationAr: 'احتراق الميثان تفاعل طارد يُنتج حرارة وضوء.', points: 10 },
    [
      { textAr: 'احتراق الميثان', isCorrect: true },
      { textAr: 'البناء الضوئي', isCorrect: false, explanationAr: 'البناء الضوئي يمتص طاقة ضوئية.' },
      { textAr: 'تحلل كربونات الكالسيوم', isCorrect: false, explanationAr: 'يحتاج تسخيناً مستمراً — ماص.' },
      { textAr: 'التحليل الكهربائي للماء', isCorrect: false, explanationAr: 'يحتاج طاقة كهربائية — ماص.' },
    ],
  );

  await createQuestion(
    { textAr: 'إذا احتاج تفاعل إلى تسخين مستمر ليستمر، فماذا نستنتج عن نوعه؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[1].id, explanationAr: 'التفاعل الذي يحتاج تسخيناً مستمراً يمتص طاقة من المحيط، فهو ماصّ للطاقة.', points: 15 },
    [
      { textAr: 'تفاعل ماصّ للطاقة', isCorrect: true },
      { textAr: 'تفاعل طارد للطاقة', isCorrect: false },
      { textAr: 'لا يمكن تحديد النوع', isCorrect: false },
      { textAr: 'تفاعل متعادل', isCorrect: false },
    ],
  );

  // ── Node 3 Questions ──
  await createQuestion(
    { textAr: 'إذا كان المحتوى الحراري للنواتج أقل من المتفاعلات، فإن ΔH تكون:', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[2].id, explanationAr: 'عندما ينخفض المحتوى الحراري من المتفاعلات إلى النواتج، يكون الفرق سالباً.', points: 10 },
    [
      { textAr: 'سالبة', isCorrect: true },
      { textAr: 'موجبة', isCorrect: false, explanationAr: 'ΔH موجبة عندما يكون المحتوى الحراري للنواتج أعلى.' },
      { textAr: 'صفراً', isCorrect: false },
      { textAr: 'لا يمكن تحديدها', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'إذا كان المحتوى الحراري للنواتج أقل من المتفاعلات، فماذا يمكن استنتاجه عن اتجاه انتقال الطاقة؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[2].id, explanationAr: 'الطاقة انتقلت من النظام إلى المحيط كحرارة، لأن النواتج فقدت طاقة.', points: 15 },
    [
      { textAr: 'الطاقة انتقلت من النظام إلى المحيط (تفاعل طارد)', isCorrect: true },
      { textAr: 'الطاقة انتقلت من المحيط إلى النظام', isCorrect: false },
      { textAr: 'لم تنتقل طاقة', isCorrect: false },
      { textAr: 'الطاقة تحولت إلى كتلة', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'في تفاعل احتراق غاز الميثان، ΔH = −890 kJ. ما اتجاه انتقال الطاقة في هذا التفاعل؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[2].id, explanationAr: 'الإشارة السالبة تعني أن الطاقة خرجت من النظام إلى المحيط، فالتفاعل طارد للحرارة.', points: 10 },
    [
      { textAr: 'من النظام إلى المحيط (طارد)', isCorrect: true },
      { textAr: 'من المحيط إلى النظام (ماصّ)', isCorrect: false },
      { textAr: 'لا يوجد انتقال للطاقة', isCorrect: false },
      { textAr: 'يعتمد على درجة الحرارة', isCorrect: false },
    ],
  );

  // ── Node 4 Questions ──
  await createQuestion(
    { textAr: 'ما المقصود بالمعادلة الكيميائية الحرارية؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[3].id, explanationAr: 'المعادلة الحرارية تضيف معلومة الحرارة إلى المعادلة الكيميائية الموزونة.', points: 10 },
    [
      { textAr: 'معادلة كيميائية موزونة تتضمن كمية الحرارة المصاحبة للتفاعل', isCorrect: true },
      { textAr: 'معادلة تصف حالات المادة فقط', isCorrect: false },
      { textAr: 'معادلة غير موزونة', isCorrect: false },
      { textAr: 'معادلة فيزيائية', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'ماذا تعني ΔH = -572 KJ في معادلة تكوين الماء؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[3].id, explanationAr: 'القيمة السالبة تعني أن 572 كيلو جول من الطاقة انبعثت أثناء التفاعل — تفاعل طارد.', points: 15 },
    [
      { textAr: 'التفاعل طارد للطاقة وانبعث 572 كيلو جول', isCorrect: true },
      { textAr: 'التفاعل ماصّ للطاقة', isCorrect: false, explanationAr: 'الإشارة السالبة تدل على الطرد لا الامتصاص.' },
      { textAr: 'لا يمكن التحديد', isCorrect: false },
      { textAr: 'التفاعل لا يصاحبه طاقة', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'في المعادلة: 2H₂(g) + O₂(g) → 2H₂O(l), ΔH = -572 kJ، هل الإشارة السالبة تعني أن التفاعل ماصّ أم طارد؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[3].id, explanationAr: 'الإشارة السالبة تدل على أن التفاعل طارد للحرارة وأن الطاقة خرجت من النظام.', points: 10 },
    [
      { textAr: 'طارد للحرارة', isCorrect: true },
      { textAr: 'ماصّ للحرارة', isCorrect: false },
      { textAr: 'لا يمكن التحديد من الإشارة', isCorrect: false },
      { textAr: 'متعادل', isCorrect: false },
    ],
  );

  // ── Node 5 Questions ──
  await createQuestion(
    { textAr: 'هل كسر الروابط يحتاج طاقة أم يطلق طاقة؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[4].id, explanationAr: 'كسر الروابط عملية تحتاج إدخال طاقة (ماصة).', points: 10 },
    [
      { textAr: 'يحتاج طاقة (امتصاص)', isCorrect: true },
      { textAr: 'يطلق طاقة', isCorrect: false, explanationAr: 'تكوين الروابط هو الذي يطلق طاقة.' },
      { textAr: 'لا علاقة للطاقة بالروابط', isCorrect: false },
      { textAr: 'يعتمد على نوع الرابطة', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'إذا كانت رابطة ما ذات طاقة رابطة كبيرة، فماذا يمكن أن نستنتج عن قوتها؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[4].id, explanationAr: 'كلما زادت طاقة الرابطة، دلّ ذلك على أنها أقوى وتحتاج طاقة أكبر لكسرها.', points: 15 },
    [
      { textAr: 'أنها رابطة قوية تحتاج طاقة كبيرة لكسرها', isCorrect: true },
      { textAr: 'أنها رابطة ضعيفة', isCorrect: false },
      { textAr: 'أنها رابطة أيونية فقط', isCorrect: false },
      { textAr: 'لا يمكن الاستنتاج', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'رابطة O=O طاقتها 498 kJ/mol ورابطة H-H طاقتها 436 kJ/mol. أيهما أقوى؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[4].id, explanationAr: 'رابطة O=O ذات طاقة أكبر (498 kJ/mol) لذلك هي أقوى وتحتاج طاقة أكبر لكسرها.', points: 10 },
    [
      { textAr: 'رابطة O=O لأن طاقتها أكبر', isCorrect: true },
      { textAr: 'رابطة H-H لأن الهيدروجين أخف', isCorrect: false },
      { textAr: 'متساويتان في القوة', isCorrect: false },
      { textAr: 'لا يمكن المقارنة', isCorrect: false },
    ],
  );

  // ── Node 6 Questions ──
  await createQuestion(
    { textAr: 'إذا كانت طاقات الروابط المكسورة أكبر من طاقات الروابط المتكونة، فماذا نستنتج عن إشارة ΔH؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[5].id, explanationAr: 'إذا كان مجموع المكسورة أكبر من المتكونة، فإن ΔH موجبة والتفاعل ماصّ.', points: 15 },
    [
      { textAr: 'ΔH موجبة والتفاعل ماصّ للطاقة', isCorrect: true },
      { textAr: 'ΔH سالبة والتفاعل طارد', isCorrect: false },
      { textAr: 'ΔH تساوي صفراً', isCorrect: false },
      { textAr: 'لا يمكن تحديدها', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'ما المقصود بحرارة التفاعل المحسوبة من طاقات الروابط؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[5].id, explanationAr: 'حرارة التفاعل = مجموع طاقات الروابط المكسورة − مجموع طاقات الروابط المتكونة.', points: 10 },
    [
      { textAr: 'الفرق بين طاقات الروابط المكسورة والمتكونة', isCorrect: true },
      { textAr: 'مجموع طاقات كل الروابط', isCorrect: false },
      { textAr: 'طاقة أقوى رابطة في التفاعل', isCorrect: false },
      { textAr: 'درجة حرارة التفاعل', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'رتب الخطوات التالية لحساب حرارة التفاعل باستخدام طاقات الروابط:', type: 'ORDER', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[5].id, explanationAr: 'يجب أولاً تحديد الروابط المكسورة، ثم المتكونة، ثم التعويض في القانون.', points: 15 },
    [
      { textAr: 'تحديد نوع وعدد الروابط المكسرة في المتفاعلات', isCorrect: true },
      { textAr: 'تحديد نوع وعدد الروابط المتكونة في النواتج', isCorrect: true },
      { textAr: 'حساب مجموع طاقات الروابط المكسرة', isCorrect: true },
      { textAr: 'حساب مجموع طاقات الروابط المتكونة', isCorrect: true },
      { textAr: 'التعويض في قانون ΔH', isCorrect: true },
    ],
  );

  // ── Node 7 Questions ──
  await createQuestion(
    { textAr: 'إذا كانت الطاقة المصاحبة لمول واحد معروفة، فماذا يحدث لكمية الطاقة عندما يتضاعف عدد المولات؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[6].id, explanationAr: 'كمية الحرارة تتناسب طردياً مع كمية المادة.', points: 10 },
    [
      { textAr: 'تتضاعف كمية الطاقة', isCorrect: true },
      { textAr: 'تبقى ثابتة', isCorrect: false },
      { textAr: 'تنخفض للنصف', isCorrect: false },
      { textAr: 'لا علاقة بينهما', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'اسحب كل مصطلح إلى تعريفه الصحيح (أعلى طاقة، أقل طاقة، طارد، ماص):', type: 'DRAG_DROP', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[6].id, explanationAr: 'ربط المصطلحات بتعريفاتها يسهل الفهم.', points: 15 },
    [
      { textAr: 'التفاعل الطارد', isCorrect: true, explanationAr: 'تفاعل يطلق حرارة للوسط' },
      { textAr: 'التفاعل الماص', isCorrect: true, explanationAr: 'تفاعل يمتص حرارة من الوسط' },
      { textAr: 'طاقة الرابطة', isCorrect: true, explanationAr: 'الطاقة اللازمة لكسر مول من الروابط' },
    ],
  );

  await createQuestion(
    { textAr: 'إذا كانت ΔH لمول واحد من المادة = −400 kJ، فكم تكون الطاقة الناتجة من 3 مول؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[6].id, explanationAr: 'الطاقة = 3 × 400 = 1200 kJ لأن الطاقة تتناسب طردياً مع عدد المولات.', points: 15 },
    [
      { textAr: '1200 kJ', isCorrect: true },
      { textAr: '400 kJ', isCorrect: false },
      { textAr: '133 kJ', isCorrect: false },
      { textAr: '800 kJ', isCorrect: false },
    ],
  );

  // ── Node 8 Questions ──
  await createQuestion(
    { textAr: 'ما المقصود بحرارة الاحتراق؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[7].id, explanationAr: 'حرارة الاحتراق هي كمية الحرارة الناتجة من حرق مول واحد من المادة حرقاً تاماً.', points: 10 },
    [
      { textAr: 'كمية الحرارة الناتجة من حرق مول واحد من المادة حرقاً تاماً', isCorrect: true },
      { textAr: 'كمية الحرارة اللازمة لبدء التفاعل', isCorrect: false },
      { textAr: 'كمية الحرارة في غرام من المادة', isCorrect: false, explanationAr: 'هذا تعريف القيمة الحرارية وليس حرارة الاحتراق.' },
      { textAr: 'درجة حرارة اللهب', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'أيهما له حرارة احتراق أكبر: الميثان أم الإيثان؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[7].id, explanationAr: 'حرارة احتراق الإيثان (1560 kJ/mol) أكبر من الميثان (890 kJ/mol).', points: 10 },
    [
      { textAr: 'الإيثان (1560 kJ/mol)', isCorrect: true },
      { textAr: 'الميثان (890 kJ/mol)', isCorrect: false },
      { textAr: 'متساويان', isCorrect: false },
      { textAr: 'لا يمكن المقارنة', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'لماذا تُستخدم حرارة الاحتراق في المقارنة بين أنواع الوقود؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[7].id, explanationAr: 'لأنها تقيس كمية الطاقة لمول واحد من الوقود، مما يسمح بمقارنة عادلة بين أنواع الوقود المختلفة.', points: 15 },
    [
      { textAr: 'لأنها توفر مقياساً موحداً لمقارنة طاقة مول واحد من كل وقود', isCorrect: true },
      { textAr: 'لأنها تقيس درجة حرارة اللهب', isCorrect: false },
      { textAr: 'لأنها تعتمد على لون اللهب', isCorrect: false },
      { textAr: 'لا يمكن استخدامها في المقارنة', isCorrect: false },
    ],
  );

  // ── Node 9 Questions ──
  await createQuestion(
    { textAr: 'ماذا نعني بالقيمة الحرارية للغذاء؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[8].id, explanationAr: 'القيمة الحرارية للغذاء تعبر عن كمية الطاقة التي يمنحها الغذاء عند حرقه.', points: 10 },
    [
      { textAr: 'كمية الطاقة التي يمنحها غرام واحد من الغذاء للجسم', isCorrect: true },
      { textAr: 'درجة حرارة الغذاء', isCorrect: false },
      { textAr: 'وزن الغذاء', isCorrect: false },
      { textAr: 'حجم الغذاء', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'أكلت عبير قطعة حلوى تحتوي على 2 غم كربوهيدرات و3 غم دهون. ما الطاقة المكتسبة؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[8].id, explanationAr: 'الطاقة = (2 × 4.07) + (3 × 9.08) = 8.14 + 27.24 = 35.38 سعر حراري', points: 15 },
    [
      { textAr: '35.38 سعر حراري', isCorrect: true },
      { textAr: '8.14 سعر حراري', isCorrect: false, explanationAr: 'هذا فقط طاقة الكربوهيدرات.' },
      { textAr: '27.24 سعر حراري', isCorrect: false, explanationAr: 'هذا فقط طاقة الدهون.' },
      { textAr: '50 سعر حراري', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'إذا أراد شخص تقليل السعرات الحرارية، هل يقلل الدهون أم الكربوهيدرات؟ ولماذا؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[8].id, explanationAr: 'الدهون تعطي 9.08 سعر/غم بينما الكربوهيدرات 4.07 سعر/غم، لذا تقليل الدهون أكثر فعالية.', points: 15 },
    [
      { textAr: 'يقلل الدهون لأن قيمتها الحرارية أعلى (9.08 سعر/غم)', isCorrect: true },
      { textAr: 'يقلل الكربوهيدرات لأنها أكثر ضرراً', isCorrect: false },
      { textAr: 'لا فرق بينهما', isCorrect: false },
      { textAr: 'يقلل البروتينات فقط', isCorrect: false },
    ],
  );

  // ── Node 10 Questions ──
  await createQuestion(
    { textAr: 'كيف ترتبط الكمادات الساخنة والباردة بمفاهيم الطاقة في التفاعلات الكيميائية؟', type: 'MCQ', level: 'UNDERSTANDING', variant: 'PRIMARY', nodeId: nodes[9].id, explanationAr: 'الكمادة الساخنة تعتمد على تفاعل طارد يُطلق حرارة، والباردة على تفاعل ماصّ يمتص حرارة.', points: 10 },
    [
      { textAr: 'الساخنة تعتمد على تفاعل طارد والباردة على تفاعل ماص', isCorrect: true },
      { textAr: 'كلاهما طارد', isCorrect: false },
      { textAr: 'كلاهما ماص', isCorrect: false },
      { textAr: 'لا علاقة لها بالتفاعلات الكيميائية', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'صنّف الكمادة الباردة: هل تعتمد على تفاعل ماص أم طارد؟', type: 'MCQ', level: 'APPLICATION', variant: 'PRIMARY', nodeId: nodes[9].id, explanationAr: 'الكمادة الباردة تستخدم نترات الأمونيوم التي تذوب بتفاعل ماصّ يسحب حرارة من الوسط.', points: 10 },
    [
      { textAr: 'تفاعل ماصّ للحرارة', isCorrect: true },
      { textAr: 'تفاعل طارد للحرارة', isCorrect: false, explanationAr: 'الطارد يرفع الحرارة، لكن الكمادة الباردة تخفضها.' },
      { textAr: 'لا يوجد تفاعل', isCorrect: false },
      { textAr: 'تفاعل متعادل', isCorrect: false },
    ],
  );

  await createQuestion(
    { textAr: 'لماذا تُعدّ الكمادة الساخنة مثالاً تطبيقياً على التفاعل الطارد في الحياة؟', type: 'MCQ', level: 'REASONING', variant: 'PRIMARY', nodeId: nodes[9].id, explanationAr: 'لأنها تعتمد على تفاعل كيميائي يطلق حرارة للوسط المحيط، وهو تعريف التفاعل الطارد.', points: 15 },
    [
      { textAr: 'لأن التفاعل داخلها يطلق حرارة للجسم (طارد)', isCorrect: true },
      { textAr: 'لأنها تمتص حرارة من الجسم', isCorrect: false },
      { textAr: 'لأنها تعمل بالكهرباء', isCorrect: false },
      { textAr: 'لا علاقة لها بالتفاعلات الكيميائية', isCorrect: false },
    ],
  );

  // ─── Remediation Cards ────────────────────
  console.log('🩹 إنشاء بطاقات الدعم...');
  for (let i = 0; i < nodes.length - 1; i++) {
    await prisma.remediationCard.create({
      data: {
        titleAr: `مراجعة: ${nodes[i].titleAr}`,
        contentAr: nodes[i].introductionAr,
        level: 'UNDERSTANDING',
        nodeId: nodes[i].id,
      },
    });
  }

  // ─── Hints ────────────────────────────────
  console.log('💡 إنشاء التلميحات...');
  const hintsData = [
    { textAr: 'التغير في الطاقة قد يظهر من خلال حرارة، ضوء، أو حاجة التفاعل إلى مصدر طاقة.', type: 'DEFINITION', nodeId: nodes[0].id, level: 'UNDERSTANDING' as const },
    { textAr: 'الطارد: تخرج فيه الطاقة من النظام.\nالماص: تدخل فيه الطاقة إلى النظام.\nإذا سخن الوسط، فغالباً خرجت إليه طاقة.', type: 'COMPARISON', nodeId: nodes[1].id, level: 'UNDERSTANDING' as const },
    { textAr: 'ΔH يعني الفرق بين طاقة البداية وطاقة النهاية.\nقارن بين المتفاعلات والنواتج لتعرف هل خرجت طاقة أو امتُصّت.', type: 'DEFINITION', nodeId: nodes[2].id, level: 'UNDERSTANDING' as const },
    { textAr: 'المعادلة الحرارية لا تذكر المواد فقط، بل تذكر الحرارة أيضاً.\nالإشارة السالبة ترتبط بخروج الطاقة من النظام.', type: 'DEFINITION', nodeId: nodes[3].id, level: 'UNDERSTANDING' as const },
    { textAr: 'الكسر يحتاج إدخال طاقة.\nالتكوين يصاحبه خروج طاقة.\nالرابطة الأعلى طاقة تكون عادة أقوى.', type: 'COMPARISON', nodeId: nodes[4].id, level: 'UNDERSTANDING' as const },
    { textAr: 'الروابط في المتفاعلات تُكسر.\nالروابط في النواتج تتكون.\nإذا احتاج التفاعل طاقة أكبر مما أطلق، فالمحصلة موجبة.', type: 'PROCEDURE', nodeId: nodes[5].id, level: 'APPLICATION' as const },
    { textAr: 'كمية الحرارة تتناسب مع كمية المادة في المعادلة.\nإذا زادت المولات زادت الحرارة بالنسبة نفسها.', type: 'DEFINITION', nodeId: nodes[6].id, level: 'APPLICATION' as const },
    { textAr: 'احتراق تام + مول واحد + كمية حرارة ناتجة.\nالقيمة الأعلى تعني طاقة أكثر من نفس المقدار.', type: 'DEFINITION', nodeId: nodes[7].id, level: 'UNDERSTANDING' as const },
    { textAr: 'القيمة الحرارية تعبر عن الطاقة التي يمنحها الغذاء.\nالقيم الأعلى تعني طاقة أكبر.', type: 'DEFINITION', nodeId: nodes[8].id, level: 'UNDERSTANDING' as const },
    { textAr: 'التبريد يعني سحب حرارة من الجسم.\nالسحب يعني امتصاص طاقة.\nالتسخين يعني إطلاق طاقة.', type: 'COMPARISON', nodeId: nodes[9].id, level: 'UNDERSTANDING' as const },
  ];
  for (const h of hintsData) {
    await prisma.hint.create({ data: h });
  }

  // ─── Initialize first node as OPEN for student ──
  console.log('🚀 تهيئة تقدم الطالب...');
  await prisma.nodeProgress.create({
    data: { userId: student.id, nodeId: nodes[0].id, status: 'IN_PROGRESS' },
  });

  console.log('✅ تم ملء قاعدة البيانات بنجاح!');
  console.log(`   📚 ${nodesData.length} عقدة مفاهيمية`);
  console.log(`   📝 ${contentData.length} قطعة محتوى`);
  console.log(`   📐 ${formulasData.length} معادلة`);
  console.log(`   📊 4 جداول مرجعية`);
  console.log(`   ❓ 20+ سؤال`);
  console.log(`   💡 ${hintsData.length} تلميح`);
  console.log(`   👤 3 مستخدمين (admin, teacher, student)`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ في ملء قاعدة البيانات:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
