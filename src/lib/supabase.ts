import { createClient } from "@supabase/supabase-js";
import { Quiz, QuizAttempt, UserStats, FeedbackData } from "@/types";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client for writes — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Quizzes ────────────────────────────────────────────────────────────────────

export async function saveQuiz(quiz: Quiz) {
  const { data, error } = await supabaseAdmin.from("quizzes").upsert({
    id: quiz.id,
    user_id: quiz.createdBy,
    title: quiz.title,
    topic: quiz.topic,
    description: quiz.description ?? null,
    difficulty: quiz.difficulty,
    questions: quiz.questions,
    is_public: quiz.isPublic,
    share_code: quiz.shareCode ?? null,
    time_limit: quiz.timeLimit ?? 0,
    tags: quiz.tags ?? [],
    created_at: quiz.createdAt,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) {
    console.error("Supabase saveQuiz error:", error);
    throw new Error(error.message ?? "Failed to save quiz");
  }
  return data;
}

export async function getMyQuizzes(userId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbToQuiz);
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const { data } = await supabase.from("quizzes").select("*").eq("id", id).single();
  return data ? dbToQuiz(data) : null;
}

export async function getQuizByShareCode(code: string): Promise<Quiz | null> {
  const { data } = await supabase
    .from("quizzes").select("*").eq("share_code", code).eq("is_public", true).single();
  return data ? dbToQuiz(data) : null;
}

export async function deleteQuiz(id: string) {
  const { error } = await supabaseAdmin.from("quizzes").delete().eq("id", id);
  if (error) throw error;
}

// ── Attempts ───────────────────────────────────────────────────────────────────

export async function saveAttempt(attempt: QuizAttempt) {
  const { data, error } = await supabaseAdmin.from("quiz_attempts").insert({
    id: attempt.id,
    quiz_id: attempt.quizId,
    user_id: attempt.userId,
    mode: attempt.mode,
    answers: attempt.answers,
    score: attempt.score,
    total_questions: attempt.totalQuestions,
    percentage: attempt.percentage,
    time_taken: attempt.timeTaken,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getAttemptById(id: string) {
  const { data } = await supabase.from("quiz_attempts").select("*, quizzes(*)").eq("id", id).single();
  return data;
}

export async function getMyAttempts(userId: string, limit = 50) {
  const { data } = await supabase
    .from("quiz_attempts").select("*, quizzes(*)")
    .eq("user_id", userId).order("completed_at", { ascending: false }).limit(limit);
  return data ?? [];
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<UserStats> {
  const attempts = await getMyAttempts(userId, 200);
  if (!attempts.length) {
    return { totalAttempts: 0, totalCorrect: 0, totalQuestions: 0, averageScore: 0, streak: 0, topicStats: [], recentAttempts: [], achievements: [] };
  }

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.reduce((n: number, a: { score: number }) => n + a.score, 0);
  const totalQuestions = attempts.reduce((n: number, a: { total_questions: number }) => n + a.total_questions, 0);
  const averageScore = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const topicMap: Record<string, { attempts: number; totalScore: number; bestScore: number }> = {};
  for (const a of attempts) {
    const topic: string = (a.quizzes as { topic?: string } | null)?.topic ?? "Unknown";
    if (!topicMap[topic]) topicMap[topic] = { attempts: 0, totalScore: 0, bestScore: 0 };
    topicMap[topic].attempts++;
    topicMap[topic].totalScore += a.percentage;
    topicMap[topic].bestScore = Math.max(topicMap[topic].bestScore, a.percentage);
  }
  const topicStats = Object.entries(topicMap).map(([topic, s]) => ({
    topic, attempts: s.attempts,
    avgScore: Math.round(s.totalScore / s.attempts),
    bestScore: s.bestScore,
  }));

  return {
    totalAttempts, totalCorrect, totalQuestions, averageScore,
    streak: calcStreak(attempts),
    topicStats,
    recentAttempts: attempts.slice(0, 5).map((a: { quizzes: Record<string, unknown> | null }) => ({ attempt: a, quiz: a.quizzes })),
    achievements: buildAchievements(totalAttempts, averageScore),
  };
}

// ── Feedback ───────────────────────────────────────────────────────────────────

export async function saveFeedback(fb: FeedbackData) {
  await supabaseAdmin.from("feedback").insert({
    attempt_id: fb.attemptId, quiz_id: fb.quizId,
    rating: fb.rating, comment: fb.comment, would_retake: fb.wouldRetake,
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dbToQuiz(d: Record<string, unknown>): Quiz {
  return {
    id: d.id as string, title: d.title as string, topic: d.topic as string,
    description: d.description as string | undefined,
    difficulty: d.difficulty as Quiz["difficulty"],
    questions: d.questions as Quiz["questions"],
    createdBy: d.user_id as string,
    createdAt: d.created_at as string, updatedAt: d.updated_at as string,
    isPublic: d.is_public as boolean,
    shareCode: d.share_code as string | undefined,
    timeLimit: d.time_limit as number | undefined,
    tags: d.tags as string[] | undefined,
  };
}

function calcStreak(attempts: { completed_at: string }[]): number {
  if (!attempts.length) return 0;
  const days = [...new Set(attempts.map((a) => new Date(a.completed_at).toDateString()))];
  const today = new Date().toDateString();
  if (days[0] !== today) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++; else break;
  }
  return streak;
}

function buildAchievements(total: number, avg: number) {
  const list = [];
  if (total >= 1) list.push({ id: "first", title: "First Step!", description: "Completed your first quiz", emoji: "🎯", unlockedAt: new Date().toISOString() });
  if (total >= 5) list.push({ id: "five", title: "Getting Warmed Up", description: "Completed 5 quizzes", emoji: "🔥" });
  if (total >= 10) list.push({ id: "ten", title: "Dedicated Learner", description: "Completed 10 quizzes", emoji: "📚" });
  if (avg >= 80) list.push({ id: "ace", title: "High Achiever", description: "Average score above 80%", emoji: "⭐" });
  if (avg >= 95) list.push({ id: "perfect", title: "Perfectionist", description: "Average score above 95%", emoji: "👑" });
  return list;
}