# 🎓 QuizGenius — AI-Powered Quiz Platform for Students

A full-featured, production-ready quiz application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Google Gemini AI**, **Clerk**, and **Supabase**.

---

## ✨ Features

### For Quiz Creators
- **AI Generation** — Generate MCQ, True/False, and Fill-in-Blank questions on any topic via Google Gemini
- **Document Upload** — Upload a `.txt` file and generate questions based on that content
- **Manual Builder** — Write and fully customize your own questions with rich editor
- **Edit AI Output** — Edit every generated question, option, explanation and hint
- **Configurable** — Set difficulty, number of questions, time limit, and public/private
- **Share Links** — Generate a unique share code for public quizzes (e.g. `/join/ABC123`)

### For Quiz Takers
- **Learning Mode** — Instant right/wrong feedback, encouragement messages, AI hints, and explanations after each question
- **Test Mode** — Strict exam mode: no feedback until end, no hints, confidence slider
- **Confidence Slider** — Rate your confidence before submitting in test mode
- **AI Tutor Chat** — Ask the AI for hints or explanations during learning mode
- **Progress Navigation** — Jump between questions with visual status indicators
- **Timer Support** — Countdown timer with warning when < 60 seconds left
- **Auto-save** — Quiz progress persisted across page refreshes via Zustand + localStorage

### Analytics & History
- **Dashboard** — Streaks, average score, total questions, radar chart per topic
- **Achievements** — Unlockable badges for milestones
- **Full History** — All attempts with filtering, sorting, and retake option
- **Results Page** — Score, time, question-by-question breakdown with correct answers
- **Feedback** — Rate and review the quiz to improve future generation

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Google Gemini 1.5 Flash | AI question generation & chat |
| Clerk | Authentication |
| Supabase (PostgreSQL) | Data persistence |
| Zustand | State management |
| Recharts | Analytics charts |
| React Confetti | Celebration effects |
| React Dropzone | Document uploads |

---

## 🚀 Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd quiz-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

```env
# Clerk — https://clerk.com (free tier)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Google Gemini — https://aistudio.google.com (free tier)
GEMINI_API_KEY=AIza...

# Supabase — https://supabase.com (free tier)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Set up Supabase database

1. Go to your Supabase project → SQL Editor
2. Copy and run the contents of `supabase-schema.sql`
3. This creates the `quizzes`, `quiz_attempts`, and `feedback` tables with RLS policies

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
quiz-app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Sign-in, Sign-up pages
│   │   ├── (app)/           # Protected app routes with sidebar
│   │   │   ├── dashboard/   # Analytics dashboard
│   │   │   ├── create/      # Quiz creation (AI + manual)
│   │   │   ├── history/     # Attempt history
│   │   │   └── explore/     # Browse public quizzes
│   │   ├── quiz/[id]/       # Quiz taking experience
│   │   ├── results/[id]/    # Results & feedback
│   │   ├── join/[code]/     # Join by share code
│   │   └── api/             # API routes (Gemini, Chat)
│   ├── lib/
│   │   ├── ai.ts            # Gemini integration + helpers
│   │   └── supabase.ts      # Database helpers
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript types
├── supabase-schema.sql      # Database schema
└── .env.local.example       # Environment template
```

---

## 🏗 Architecture Decisions

- **App Router** — Uses Next.js 14 App Router for layouts, nested routing, and API routes
- **Server-side API keys** — Gemini API key never exposed to client; all AI calls go through `/api/` routes
- **Zustand + persist** — Quiz taking state saved to localStorage for auto-resume on refresh
- **CSS Variables** — Full dark/light mode via CSS custom properties, avoiding Tailwind's `dark:` class explosion
- **Clerk JWT** — Supabase RLS policies use Clerk's `sub` claim for row-level security

---

## ⚠️ Known Limitations

- Document upload supports `.txt` only (PDF parsing requires additional library)
- Gemini free tier has rate limits (~15 requests/minute)
- Fill-in-blank answers are matched case-insensitively (exact match required)
- Leaderboards and real-time multiplayer not yet implemented

---

## 📸 Key Screens

1. **Landing Page** — Hero, features, mode comparison
2. **Dashboard** — Stats, radar chart, achievements, recent activity
3. **Create Quiz** — AI setup → generate → full question editor
4. **Mode Selector** — Learning vs Test mode with feature breakdown
5. **Quiz Taking** — Question card, options, confidence slider, AI chat panel
6. **Results Page** — Score, breakdown, explanations, feedback form
7. **History** — All attempts with filter/sort/retake
