"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft, ChevronRight, MessageCircle, X, Send,
  Lightbulb, Clock, CheckCircle2, XCircle, Flag, Brain,
  BookOpen, Zap, Loader2, AlertTriangle, Map,
} from "lucide-react";
import { useTakingStore, useChatStore } from "@/store";
import { getQuizById, saveAttempt } from "@/lib/supabase";
import { getEncouragement, fmtTime, confidenceLabel } from "@/lib/ai";
import { Question, QuizMode } from "@/types";

// ── Confidence Slider ──────────────────────────────────────────────────────────
function ConfidenceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const emojis = ["😰", "😕", "😐", "🙂", "😎"];
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#059669"];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Confidence level</span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: colors[value - 1] }}>
          {emojis[value - 1]} {confidenceLabel(value)}
        </span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={e => onChange(+e.target.value)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: colors[value - 1] }} />
      <div className="flex justify-between text-sm">{emojis.map(e => <span key={e}>{e}</span>)}</div>
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function ChatPanel({ question, topic, onClose }: { question: Question; topic: string; onClose: () => void }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, loading, addMessage, setLoading, clear } = useChatStore();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;
    setInput("");
    addMessage({ role: "user", content });
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content }], context: { question: question.question, topic, hint: question.hint } }),
      });
      const data = await res.json();
      addMessage({ role: "assistant", content: data.message });
    } catch { addMessage({ role: "assistant", content: "Sorry, I ran into an issue! Please try again. 🙏" }); }
    finally { setLoading(false); }
  };

  const QUICK = ["💡 Give me a hint", "📚 Explain this concept", "🤔 Why is that the right answer?"];

  return (
    <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl border-l"
      style={{ width: "min(340px, 92vw)", background: "var(--bg-card)", borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>AI Tutor</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ask for hints or explanations</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost btn btn-icon"><X className="w-4 h-4" /></button>
      </div>

      {/* Quick prompts */}
      <div className="p-3 flex gap-2 flex-wrap border-b" style={{ borderColor: "var(--border-soft)" }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-xs px-2.5 py-1.5 rounded-full font-medium transition-all"
            style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--blue-light)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--blue)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Brain className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ask me anything about this question!</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={m.role === "user"
                ? { background: "var(--blue)", color: "#fff", borderBottomRightRadius: 4 }
                : { background: "var(--bg-subtle)", color: "var(--text)", borderBottomLeftRadius: 4 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-subtle)", borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: `${i * 0.15}s` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            className="input flex-1 text-sm py-2.5" placeholder="Ask something…" />
          <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-primary btn px-3 py-2.5">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mode Selector ─────────────────────────────────────────────────────────────
function ModeSelector({ onSelect, quiz }: { onSelect: (m: QuizMode) => void; quiz: { title: string; topic: string; questions: { length: number } } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 badge-blue mb-4 text-sm font-semibold px-3 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4" /> {quiz.questions.length} Questions · {quiz.topic}
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{quiz.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>Choose how you want to study</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              mode: "learning" as QuizMode, emoji: "📖", label: "Learning Mode",
              grad: "from-violet-400 to-violet-600",
              features: ["Instant feedback after each question", "Motivating / encouraging messages", "AI hints & explanations available", "Know right/wrong before moving on"],
            },
            {
              mode: "test" as QuizMode, emoji: "📝", label: "Test Mode",
              grad: "from-amber-400 to-orange-500",
              features: ["No feedback until quiz ends", "No hints or AI assistant", "Confidence slider before submitting", "Score revealed only at the end"],
            },
          ].map((opt, i) => (
            <motion.button key={opt.mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              onClick={() => onSelect(opt.mode)}
              className="card p-6 text-left hover:-translate-y-1 transition-all duration-200 group border-2 hover:shadow-card-hover"
              style={{ borderColor: "var(--border)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = opt.mode === "learning" ? "var(--violet)" : "var(--amber)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}>
              <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${opt.grad} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>{opt.emoji}</div>
              <h3 className="text-xl font-black mb-3" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{opt.label}</h3>
              <ul className="space-y-2">
                {opt.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: opt.mode === "learning" ? "var(--violet)" : "var(--amber)" }} />{f}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useTakingStore();
  const { clear: clearChat } = useChatStore();
  const s = store.state;

  const [quizData, setQuizData] = useState<Awaited<ReturnType<typeof getQuizById>>>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [fillInput, setFillInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load quiz
  useEffect(() => {
    getQuizById(id).then(q => {
      setQuizData(q);
      // If store has a different quiz or retake flag, clear store
      if (!s || s.quiz.id !== id || searchParams.get("retake")) store.reset();
    }).finally(() => setQuizLoading(false));
  }, [id]);

  // Timer
  useEffect(() => {
    if (!s || s.isComplete) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [s?.isComplete, !!s]);

  // Auto-submit on time limit
  useEffect(() => {
    if (!s?.quiz.timeLimit || !s.quiz.timeLimit) return;
    if (elapsed >= s.quiz.timeLimit * 60) handleFinish();
  }, [elapsed]);

  const handleModeSelect = (mode: QuizMode) => {
    if (!quizData) return;
    clearChat();
    store.startQuiz(quizData, mode);
    setElapsed(0);
  };

  const handleAnswer = (ans: string) => { if (!answered) setSelectedAnswer(ans); };

  const handleSubmitAnswer = () => {
    if (!s || answered) return;
    const q = s.quiz.questions[s.currentIndex];
    const finalAns = q.type === "fill-blank" ? fillInput.trim().toLowerCase() : selectedAnswer;
    if (!finalAns) return toast.error("Please select an answer");
    const correct = q.type === "fill-blank"
      ? finalAns === q.correctAnswer.toLowerCase()
      : finalAns === q.correctAnswer;
    store.submitAnswer(q.id, finalAns, correct);
    setAnswered(true);
    if (s.mode === "learning") setEncouragement(getEncouragement(correct));
  };

  const handleNext = () => {
    if (!s) return;
    if (s.currentIndex >= s.quiz.questions.length - 1) { handleFinish(); return; }
    store.goNext();
    setSelectedAnswer(""); setFillInput(""); setAnswered(false); setEncouragement(null);
  };

  const handleFinish = useCallback(async () => {
    if (!s || !user?.id || submitting) return;
    setSubmitting(true);
    store.finish();
    const correct = s.answers.filter(a => a.isCorrect).length;
    const total = s.quiz.questions.length;
    const attempt = {
      id: uuidv4(), quizId: s.quiz.id, userId: user.id, mode: s.mode,
      answers: s.answers, score: correct, totalQuestions: total,
      percentage: Math.round((correct / total) * 100),
      timeTaken: elapsed, startedAt: new Date(s.startTime).toISOString(),
      completedAt: new Date().toISOString(),
    };
    try { await saveAttempt(attempt); } catch { /* still navigate */ }
    router.push(`/results/${attempt.id}?quizId=${s.quiz.id}`);
  }, [s, user?.id, elapsed, submitting]);

  if (quizLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--blue)" }} />
    </div>
  );

  if (!quizData) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-5" style={{ background: "var(--bg)" }}>
      <AlertTriangle className="w-12 h-12 text-amber-400" />
      <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>Quiz not found</h2>
      <button onClick={() => router.push("/dashboard")} className="btn-primary btn">Go to Dashboard</button>
    </div>
  );

  if (!s || s.quiz.id !== id) return <ModeSelector quiz={quizData} onSelect={handleModeSelect} />;

  const q = s.quiz.questions[s.currentIndex];
  const total = s.quiz.questions.length;
  const pct = ((s.currentIndex + 1) / total) * 100;
  const existingAnswer = s.answers.find(a => a.questionId === q.id);
  const timeLimit = s.quiz.timeLimit ? s.quiz.timeLimit * 60 : null;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const timerWarn = timeLeft !== null && timeLeft < 60;

  const getOptionState = (optId: string) => {
    if (!answered && !existingAnswer) return selectedAnswer === optId ? "selected" : "default";
    const myAns = existingAnswer?.selectedAnswer ?? selectedAnswer;
    if (optId === q.correctAnswer) return s.mode === "learning" ? "correct" : "default";
    if (optId === myAns && optId !== q.correctAnswer) return s.mode === "learning" ? "wrong" : "selected";
    return "default";
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="glass sticky top-0 z-40 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            {/* Left */}
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="btn-ghost btn btn-icon">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold truncate max-w-[140px] sm:max-w-xs" style={{ color: "var(--text)" }}>{s.quiz.title}</span>
              <span className="badge text-xs" style={{ background: s.mode === "learning" ? "var(--violet-light)" : "var(--amber-light)", color: s.mode === "learning" ? "var(--violet)" : "var(--amber)" }}>
                {s.mode}
              </span>
            </div>
            {/* Right */}
            <div className="flex items-center gap-2">
              {timeLeft !== null && (
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: timerWarn ? "var(--red)" : "var(--text-2)" }} className={timerWarn ? "timer-warn" : ""}>
                  <Clock className="w-3.5 h-3.5" /> {fmtTime(timeLeft)}
                </div>
              )}
              <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{s.currentIndex + 1}/{total}</span>
              {s.mode === "learning" && (
                <button onClick={() => setChatOpen(!chatOpen)} className="btn-ghost btn btn-icon relative" style={{ color: chatOpen ? "var(--blue)" : "var(--text-muted)" }}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                </button>
              )}
              <button onClick={() => setShowNav(!showNav)} className="btn-ghost btn btn-icon">
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="progress">
            <motion.div className="progress-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Question navigator drawer */}
      <AnimatePresence>
        {showNav && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border-b py-3 px-4" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
            <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
              {s.quiz.questions.map((_, i) => {
                const ans = s.answers.find(a => a.questionId === s.quiz.questions[i].id);
                return (
                  <button key={i} onClick={() => { store.goTo(i); setSelectedAnswer(""); setFillInput(""); setAnswered(!!s.answers.find(a => a.questionId === s.quiz.questions[i].id)); setEncouragement(null); setShowNav(false); }}
                    className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: i === s.currentIndex ? "var(--blue)" : ans ? (ans.isCorrect ? "var(--green-light)" : "var(--red-light)") : "var(--bg-card)",
                      color: i === s.currentIndex ? "#fff" : ans ? (ans.isCorrect ? "var(--green)" : "var(--red)") : "var(--text-muted)",
                      border: `1.5px solid ${i === s.currentIndex ? "var(--blue)" : "var(--border)"}`,
                    }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div key={s.currentIndex} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            {/* Q header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-blue text-xs">Question {s.currentIndex + 1}</span>
                <span className="badge text-xs capitalize" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>{q.type.replace("-", " ")}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{q.question}</h2>
            </div>

            {/* Encouragement (learning mode) */}
            <AnimatePresence>
              {encouragement && s.mode === "learning" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="mb-5 p-4 rounded-2xl text-center font-semibold text-sm"
                  style={{ background: existingAnswer?.isCorrect ? "var(--green-light)" : "var(--amber-light)", color: existingAnswer?.isCorrect ? "var(--green)" : "var(--amber)" }}>
                  {encouragement}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confidence slider (before answering in test mode) */}
            {s.mode === "test" && !answered && !existingAnswer && (
              <div className="card p-4 mb-5">
                <ConfidenceSlider value={s.confidence} onChange={v => store.setConfidence(v)} />
              </div>
            )}

            {/* Options */}
            {q.type !== "fill-blank" ? (
              <div className="space-y-3 mb-6">
                {q.options.map(opt => {
                  const state = getOptionState(opt.id);
                  return (
                    <motion.button key={opt.id} whileTap={{ scale: 0.98 }}
                      onClick={() => !answered && !existingAnswer && handleAnswer(opt.id)}
                      disabled={!!(answered || existingAnswer)}
                      className="option-base w-full flex items-center gap-3"
                      style={{
                        borderColor: state === "correct" ? "var(--green)" : state === "wrong" ? "var(--red)" : state === "selected" ? "var(--blue)" : "var(--border)",
                        background: state === "correct" ? "var(--green-light)" : state === "wrong" ? "var(--red-light)" : state === "selected" ? "var(--blue-light)" : "var(--bg-card)",
                        cursor: answered || existingAnswer ? "default" : "pointer",
                      }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border"
                        style={{
                          borderColor: state === "correct" ? "var(--green)" : state === "wrong" ? "var(--red)" : state === "selected" ? "var(--blue)" : "var(--border)",
                          background: state === "correct" ? "var(--green)" : state === "wrong" ? "var(--red)" : state === "selected" ? "var(--blue)" : "transparent",
                          color: ["correct", "wrong", "selected"].includes(state) ? "#fff" : "var(--text-muted)",
                        }}>
                        {state === "correct" ? <CheckCircle2 className="w-3.5 h-3.5" /> : state === "wrong" ? <XCircle className="w-3.5 h-3.5" /> : opt.id.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-left" style={{ color: "var(--text)" }}>{opt.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-2)" }}>Your Answer</label>
                <input value={fillInput} onChange={e => setFillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmitAnswer()}
                  disabled={!!(answered || existingAnswer)}
                  className="input text-base py-3 font-medium" placeholder="Type your answer here…" />
                {(answered || existingAnswer) && (
                  <p className="mt-2 text-sm font-semibold" style={{ color: existingAnswer?.isCorrect ?? (fillInput.toLowerCase() === q.correctAnswer.toLowerCase()) ? "var(--green)" : "var(--red)" }}>
                    Correct answer: <span style={{ color: "var(--text)" }}>{q.correctAnswer}</span>
                  </p>
                )}
              </div>
            )}

            {/* Explanation (learning mode after answer) */}
            <AnimatePresence>
              {(answered || existingAnswer) && s.mode === "learning" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card p-4 mb-5 border-l-4" style={{ borderLeftColor: "var(--blue)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4" style={{ color: "var(--blue)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--blue)", fontFamily: "'Outfit',sans-serif" }}>Explanation</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint button (learning mode, before answering) */}
            {s.mode === "learning" && !answered && !existingAnswer && q.hint && (
              <button onClick={() => { store.addHint(q.id); toast.success(`💡 ${q.hint}`); }}
                className="btn btn-sm flex items-center gap-1.5 mb-6" style={{ background: "var(--amber-light)", color: "var(--amber)", border: "1px solid var(--amber)" }}>
                <Lightbulb className="w-3.5 h-3.5" /> Show Hint
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t p-4 z-30" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => store.goPrev()} disabled={s.currentIndex === 0} className="btn-secondary btn btn-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!(answered || existingAnswer) ? (
            <button onClick={handleSubmitAnswer} className="btn-primary btn flex-1">
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary btn flex-1">
              {s.currentIndex === total - 1 ? (
                <><Flag className="w-4 h-4" /> Finish Quiz</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          )}

          {s.mode === "learning" && (
            <button onClick={() => setChatOpen(!chatOpen)} className={`btn btn-sm ${chatOpen ? "btn-primary" : "btn-secondary"}`}>
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && s.mode === "learning" && (
          <ChatPanel question={q} topic={s.quiz.topic} onClose={() => setChatOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
