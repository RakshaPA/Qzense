# QZense - AI-Powered Quiz Platform

QZense is an intelligent quiz platform that lets students generate quizzes on any topic instantly using AI, practice in learning or test mode, and track their progress over time.

## Live Demo
[https://qzense.vercel.app](https://qzense.vercel.app)

## GitHub Repository
https://github.com/RakshaPA/Qzense

---

## Features Implemented

- **AI Quiz Generation** — Generate quizzes on any topic instantly using Groq AI (Llama 3.3 70B)
- **Manual Quiz Builder** — Create custom quizzes with MCQ, True/False, and Fill-in-the-blank questions
- **Learning Mode** — Instant feedback, hints, explanations, and AI chat assistant after each question
- **Test Mode** — No hints or feedback until the end, strict exam-style scoring
- **Progress Tracking** — Dashboard with stats, streaks, topic radar chart, and achievements
- **Quiz History** — View all past attempts with scores and time taken
- **Public/Private Quizzes** — Share quizzes with others or keep them private
- **Dark Mode** — Full dark/light mode support
- **Secure Auth** — Authentication powered by Clerk

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| AI | Groq API (Llama 3.3 70B) |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Deployment | Vercel |

---

## Architecture Decisions

**Next.js App Router** — Used for both frontend and backend API routes in a single framework, reducing complexity and deployment overhead.

**Groq over OpenAI** — Groq provides a free tier with extremely fast inference (under 3 seconds per generation) with no rate limits, making it ideal for a hackathon project where cost and speed matter.

**Clerk for Auth** — Handles all authentication complexity including session management, OAuth, and security. Allowed focus on core features instead of building auth from scratch.

**Supabase** — Managed PostgreSQL with a generous free tier. The questions array is stored as JSONB which allows flexible question structures without complex relational schemas.

**Zustand for State** — Lightweight state management for quiz taking state, persisted across page navigations without prop drilling.

---

## AI Service Integration

QZense uses the **Groq API** with the `llama-3.3-70b-versatile` model.

The prompt engineering approach:
- System prompt instructs the model to output only valid JSON
- Temperature set to 0.3 for consistent, structured output
- Response is parsed and validated before being stored
- Fallback JSON extraction handles edge cases where the model adds extra text

The prompt specifies:
- Number of questions
- Difficulty level (easy, medium, hard)
- Question types (MCQ, True/False, Fill-in-the-blank)
- Required JSON schema for each question type

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Accounts on: Clerk, Supabase, Groq

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/qzense.git
cd qzense
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

GROQ_API_KEY=gsk_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL editor.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

**quizzes** — Stores quiz metadata and questions (as JSONB)
**quiz_attempts** — Stores user attempts, answers, scores, and timing

---

## Known Limitations

- AI generation requires a valid Groq API key with available quota
- Free tier Groq API has rate limits — large numbers of concurrent users may experience delays
- PDF document upload for question generation is planned but not yet implemented
- The AI chatbot in learning mode uses the same Groq quota as question generation
- Clerk branding appears on the sign-up popup on the free plan

---

## Screenshots

<img width="1874" height="865" alt="Landing-page png" src="https://github.com/user-attachments/assets/2cde2ccb-f796-4f0d-8ae0-b611fc20852e" />
<img width="1912" height="924" alt="Dashboard png" src="https://github.com/user-attachments/assets/11b898cf-22d8-4c7c-949b-336b09f4f69a" />
<img width="1904" height="897" alt="Create-quiz png" src="https://github.com/user-attachments/assets/70c6f70a-c380-49c3-8d6f-6ecbdddf88d1" />
<img width="1898" height="912" alt="Take-quiz png" src="https://github.com/user-attachments/assets/fa985dca-7a82-4b37-bc2a-87fee3d49a6e" />
<img width="1909" height="812" alt="Result png" src="https://github.com/user-attachments/assets/a7da82f9-76bb-4a18-8a4a-212ad99613e8" />







---

## What I Learned

Building QZense taught me how to integrate multiple third-party services (Clerk, Supabase, Groq) into a cohesive full-stack application. The biggest challenge was prompt engineering — getting the AI to consistently return valid, parseable JSON required careful system prompt design and robust error handling. I also learned the importance of choosing the right tools: switching from Gemini to Groq eliminated rate limit issues that were blocking development.

---

Built with passion for the hackathon by Raksha P A
