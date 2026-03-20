// ── Question & Quiz Types ─────────────────────────────────────────────────────

export type QuestionType = "mcq" | "true-false" | "fill-blank";
export type Difficulty = "easy" | "medium" | "hard";
export type QuizMode = "learning" | "test";

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  description?: string;
  difficulty: Difficulty;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareCode?: string;
  timeLimit?: number; // minutes; 0 = no limit
  tags?: string[];
}

// ── Attempt & Results ─────────────────────────────────────────────────────────

export interface Answer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // seconds
  confidence: number; // 1-5
  hintsUsed: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  mode: QuizMode;
  answers: Answer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTaken: number;
  startedAt: string;
  completedAt: string;
}

// ── Store Shapes ──────────────────────────────────────────────────────────────

export interface CreationState {
  step: "setup" | "edit";
  title: string;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  questionTypes: QuestionType[];
  typeCounts: Record<QuestionType, number>;
  questions: Question[];
  timeLimit: number;
  isPublic: boolean;
  useAI: boolean;
  isGenerating: boolean;
  docContent: string;
}

export interface TakingState {
  quiz: Quiz;
  mode: QuizMode;
  currentIndex: number;
  answers: Answer[];
  startTime: number;
  questionStartTime: number;
  isComplete: boolean;
  hintsUsed: Record<string, number>;
  showExplanation: boolean;
  lastAnswerCorrect: boolean | null;
  confidence: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface UserStats {
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  averageScore: number;
  streak: number;
  topicStats: TopicStat[];
  recentAttempts: AttemptWithQuiz[];
  achievements: Achievement[];
}

export interface TopicStat {
  topic: string;
  attempts: number;
  avgScore: number;
  bestScore: number;
}

export interface AttemptWithQuiz {
  attempt: Record<string, unknown>;
  quiz: Record<string, unknown> | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export interface FeedbackData {
  attemptId: string;
  quizId: string;
  rating: number;
  comment: string;
  wouldRetake: boolean;
}
