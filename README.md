# Jaxon Academy 🏛️
### AI-Powered Personalized Homeschool Platform

A world-class, full-stack homeschool curriculum platform built for K–12 families. Powered by React, TypeScript, Vite, Supabase, and an AI tutoring engine with Bloom's Taxonomy lesson progression.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎓 **Professor Grace** | AI-powered tutor delivering cinematic, story-driven lessons |
| 📚 **K–12 Curriculum Engine** | 180-day curriculum with 12+ subjects per grade level |
| 🧠 **Bloom's Taxonomy** | Lessons progress from Recall → Application → Analysis |
| 📊 **Parent Dashboard** | Real-time progress tracking, report cards, GPA, scheduling |
| 🏆 **Rewards System** | Digital badges and backpack for student achievements |
| 🎯 **Daily Pathway** | Sequential lesson locking — complete today's work in order |
| 🔬 **Exam Engine** | Subject-specific exams with AI-generated questions |
| ✍️ **Writing Lab** | Multi-draft tutor with AI feedback |
| 📅 **Calendar Scheduler** | Principal assigns lessons to specific days of the week |
| 🎨 **Custom Avatars** | Netflix-style profile picker with 6 avatar collections |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Custom HSL Design System |
| Animations | Framer Motion |
| Backend | Supabase (Postgres + Edge Functions) |
| AI | Google Gemini via Supabase Edge Functions |
| TTS | Cloud TTS with browser SpeechSynthesis fallback |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🏗 Architecture

```
src/
├── components/
│   ├── Login.tsx              # Netflix-style profile picker
│   ├── StoryLessonEngine.tsx  # Core lesson runtime (Bloom's taxonomy)
│   ├── LessonVisualizer.tsx   # Ambient YouTube background system
│   ├── ParentDashboard.tsx    # Admin panel (progress, scheduling, reports)
│   ├── Library.tsx            # Full curriculum browser (180 lessons/subject)
│   ├── ExamEngine.tsx         # Adaptive exam runner
│   ├── MultiDraftTutor.tsx    # Writing lab with AI feedback
│   └── MiniGame.tsx           # Word scramble, match pairs, fill-blank, true/false
├── utils/
│   ├── SoundManager.ts        # Unified audio (TTS, SFX, UI sounds)
│   └── ParentManager.ts       # Assignment & enrollment management
├── hooks/
│   └── useSchoolDay.ts        # Daily school day counter
└── data/
    └── curriculum-structure.json  # Full K–12 curriculum (grades + 180 lessons each)
```

---

## 📋 Student Profiles

The platform supports up to 6 student profiles + 1 Principal (parent) account:
- **Principal** — Full admin access: enroll students, assign lessons, view reports
- **Student** — Personalized dashboard locked to their enrolled grade level

---

## 🔒 Security Notes
- Student data stored in Supabase with Row Level Security enabled
- Edge Functions handle all AI API calls (keys never exposed to client)
- Principal account is PIN-protected to prevent student access

---

*Built with ❤️ for home-educating families.*
