import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  CreationState, TakingState, Quiz, QuizMode,
  Question, Answer, ChatMessage, QuestionType,
} from "@/types";

const defaultCreation: CreationState = {
  step: "setup",
  title: "",
  topic: "",
  difficulty: "medium",
  questionCount: 10,
  questionTypes: ["mcq"],
  typeCounts: { "mcq": 10, "true-false": 0, "fill-blank": 0 },
  questions: [],
  timeLimit: 0,
  isPublic: false,
  useAI: true,
  isGenerating: false,
  docContent: "",
};

function withDefaults(state: CreationState): CreationState {
  return {
    ...state,
    typeCounts: state.typeCounts ?? { "mcq": 10, "true-false": 0, "fill-blank": 0 },
  };
}

interface CreationStore {
  state: CreationState;
  set: (partial: Partial<CreationState>) => void;
  setStep: (step: CreationState["step"]) => void;
  setQuestions: (questions: Question[]) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  reset: () => void;
}

export const useCreationStore = create<CreationStore>()(
  persist(
    (set) => ({
      state: defaultCreation,
      set: (partial) => set((s) => ({ state: withDefaults({ ...s.state, ...partial }) })),
      setStep: (step) => set((s) => ({ state: withDefaults({ ...s.state, step }) })),
      setQuestions: (questions) => set((s) => ({ state: withDefaults({ ...s.state, questions }) })),
      addQuestion: (q) => set((s) => ({ state: withDefaults({ ...s.state, questions: [...s.state.questions, q] }) })),
      updateQuestion: (id, updates) =>
        set((s) => ({
          state: withDefaults({
            ...s.state,
            questions: s.state.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
          }),
        })),
      removeQuestion: (id) =>
        set((s) => ({ state: withDefaults({ ...s.state, questions: s.state.questions.filter((q) => q.id !== id) }) })),
      reset: () => set({ state: defaultCreation }),
    }),
    { name: "qz-creation" }
  )
);

interface TakingStore {
  state: TakingState | null;
  startQuiz: (quiz: Quiz, mode: QuizMode) => void;
  submitAnswer: (questionId: string, selected: string, isCorrect: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  setConfidence: (v: number) => void;
  setShowExplanation: (v: boolean) => void;
  addHint: (qId: string) => void;
  finish: () => void;
  reset: () => void;
}

export const useTakingStore = create<TakingStore>()(
  persist(
    (set) => ({
      state: null,
      startQuiz: (quiz, mode) =>
        set({
          state: {
            quiz, mode,
            currentIndex: 0,
            answers: [],
            startTime: Date.now(),
            questionStartTime: Date.now(),
            isComplete: false,
            hintsUsed: {},
            showExplanation: false,
            lastAnswerCorrect: null,
            confidence: 3,
          },
        }),
      submitAnswer: (questionId, selected, isCorrect) =>
        set((s) => {
          if (!s.state) return s;
          const timeTaken = Math.floor((Date.now() - s.state.questionStartTime) / 1000);
          const hints = s.state.hintsUsed[questionId] ?? 0;
          const answer: Answer = { questionId, selectedAnswer: selected, isCorrect, timeTaken, confidence: s.state.confidence, hintsUsed: hints };
          const existing = s.state.answers.findIndex((a) => a.questionId === questionId);
          const answers = existing >= 0
            ? s.state.answers.map((a, i) => (i === existing ? answer : a))
            : [...s.state.answers, answer];
          return {
            state: {
              ...s.state, answers,
              lastAnswerCorrect: isCorrect,
              showExplanation: s.state.mode === "learning",
            },
          };
        }),
      goNext: () =>
        set((s) => {
          if (!s.state) return s;
          return {
            state: {
              ...s.state,
              currentIndex: Math.min(s.state.currentIndex + 1, s.state.quiz.questions.length - 1),
              questionStartTime: Date.now(),
              showExplanation: false,
              confidence: 3,
              lastAnswerCorrect: null,
            },
          };
        }),
      goPrev: () =>
        set((s) => {
          if (!s.state) return s;
          return { state: { ...s.state, currentIndex: Math.max(s.state.currentIndex - 1, 0), showExplanation: false } };
        }),
      goTo: (index) =>
        set((s) => {
          if (!s.state) return s;
          return { state: { ...s.state, currentIndex: index, showExplanation: false } };
        }),
      setConfidence: (v) => set((s) => s.state ? { state: { ...s.state, confidence: v } } : s),
      setShowExplanation: (v) => set((s) => s.state ? { state: { ...s.state, showExplanation: v } } : s),
      addHint: (qId) =>
        set((s) => {
          if (!s.state) return s;
          return { state: { ...s.state, hintsUsed: { ...s.state.hintsUsed, [qId]: (s.state.hintsUsed[qId] ?? 0) + 1 } } };
        }),
      finish: () => set((s) => s.state ? { state: { ...s.state, isComplete: true } } : s),
      reset: () => set({ state: null }),
    }),
    { name: "qz-taking" }
  )
);

interface ChatStore {
  messages: ChatMessage[];
  loading: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLoading: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  messages: [],
  loading: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }],
    })),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ messages: [] }),
}));