# الخارطة المفاهيمية التكيفية — الطاقة في التفاعلات الكيميائية

> منصة تعليمية تكيفية ذكية لطلاب الصف العاشر الأساسي

## 🚀 التشغيل السريع

### المتطلبات
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### خطوات التشغيل

```bash
# 1. تشغيل Docker (PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml up -d

# 2. تثبيت الحزم
pnpm install

# 3. إنشاء Prisma Client
pnpm db:generate

# 4. تشغيل Migration
pnpm db:migrate

# 5. ملء قاعدة البيانات بالمحتوى
pnpm db:seed

# 6. تشغيل المشروع
pnpm dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Swagger Docs:** http://localhost:3001/api/docs

### حسابات تجريبية
| الدور | البريد | كلمة المرور |
|-------|--------|------------|
| طالب | student@diana.edu | student123 |
| معلم | teacher@diana.edu | teacher123 |
| مدير | admin@diana.edu | admin123 |

---

## 📁 بنية المشروع

```
Diana/
├── apps/
│   ├── web/          # React Frontend (Vite + TailwindCSS)
│   └── api/          # NestJS Backend (Prisma + PostgreSQL)
├── packages/         # Shared packages
├── docker/           # Docker Compose
├── doc/              # الملفات الأصلية (لا تُعدَّل)
└── pnpm-workspace.yaml
```

## 🎯 الميزات

- **خارطة مفاهيمية تفاعلية** — 11 عقدة بـ React Flow
- **محرك تكيفي** — 5 مسارات قرار ذكية
- **معلم ذكي** — مدعوم بـ Gemini AI مع guardrails
- **حاسبات كيميائية** — 5 أنواع × 3 أنماط
- **لوحة تقدم** — رسوم بيانية تفصيلية
- **بنك أسئلة** — 100+ سؤال من المنهج
- **تصميم RTL** — عربي بالكامل، وضع ليلي

## 📚 المحتوى العلمي

مصدر المحتوى **حصرياً** من:
1. `doc/chm10.pdf` — ملف الوحدة الدراسية (22 صفحة)
2. `doc/وثيقة التصميم الشاملة لبرمجية.docx` — وثيقة التصميم (344 فقرة)
3. `doc/22.jpeg` — الخارطة المفاهيمية البصرية
