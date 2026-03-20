"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getAttemptById, saveFeedback } from "@/lib/supabase";
import { fmtTime } from "@/lib/ai";
import { CheckCircle2, XCircle, Clock, Trophy, RefreshCw, BarChart3, ChevronDown, ChevronUp, Star, Home, MessageSquare } from "lucide-react";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} className="transition-transform hover:scale-110 active:scale-95">
          <Star className="w-7 h-7 transition-colors" style={{ color: n <= value ? "var(--amber)" : "var(--border)", fill: n <= value ? "var(--amber)" : "none" }} />
        </button>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get("quizId") ?? "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRetake, setWouldRetake] = useState(true);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const hasFired = useRef(false);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", () => setWindowSize({ width: window.innerWidth, height: window.innerHeight }));
  }, []);

  useEffect(() => {
    getAttemptById(id).then(d => { setData(d); }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (data && !hasFired.current) {
      hasFired.current = true;
      if (data.percentage >= 70) { setConfetti(true); setTimeout(() => setConfetti(false), 4500); }
    }
  }, [data]);

  const handleFeedback = async () => {
    if (!rating) return;
    try {
      await saveFeedback({ attemptId: id, quizId, rating, comment, wouldRetake });
      setFeedbackSaved(true);
    } catch { setFeedbackSaved(true); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="space-y-4 w-full max-w-md px-5">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center"><p className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Results not found</p><Link href="/dashboard" className="btn-primary btn">Dashboard</Link></div>
    </div>
  );

  const pct = Math.round(data.percentage);
  const correct = data.score;
  const total = data.total_questions;
  const answers: any[] = data.answers ?? [];
  const quiz = data.quizzes;
  const questions = quiz?.questions ?? [];
  const good = pct >= 70;
  const great = pct >= 90;

  const emoji = great ? "🏆" : good ? "🎉" : pct >= 50 ? "💪" : "📖";
  const msg = great ? "Outstanding! You've mastered this topic!" : good ? "Great job! Keep up the momentum!" : pct >= 50 ? "Good effort! Review and try again!" : "Keep studying — you'll get there!";
  const gradFrom = great ? "#10b981" : good ? "#3b82f6" : "#f59e0b";
  const gradTo = great ? "#059669" : good ? "#7c3aed" : "#f97316";

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--bg)" }}>
      {confetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={340} className="confetti-canvas" />}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero score card */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }}
          className="rounded-3xl p-8 text-center text-white mb-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative z-10">
            <div className="text-5xl mb-3">{emoji}</div>
            <div className="text-7xl font-black mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>{pct}%</div>
            <p className="text-white/90 text-lg font-semibold mb-1">{msg}</p>
            <p className="text-white/70 text-sm">{correct} out of {total} correct</p>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: Trophy, label: "Score", value: `${correct}/${total}`, color: "var(--blue)" },
            { icon: Clock, label: "Time", value: fmtTime(data.time_taken), color: "var(--violet)" },
            { icon: BarChart3, label: "Mode", value: data.mode, color: "var(--amber)" },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.color }} />
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-base font-black capitalize" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3 mb-5">
          <Link href="/dashboard" className="btn-secondary btn justify-center py-3"><Home className="w-4 h-4" /> Dashboard</Link>
          {quizId && <Link href={`/quiz/${quizId}?retake=true`} className="btn-primary btn justify-center py-3"><RefreshCw className="w-4 h-4" /> Retake Quiz</Link>}
        </motion.div>

        {/* Breakdown toggle */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card mb-5">
          <button onClick={() => setShowBreakdown(!showBreakdown)} className="w-full flex items-center justify-between p-5 font-bold text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit',sans-serif" }}>
            <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: "var(--blue)" }} /> Question Breakdown</span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 border-t space-y-3" style={{ borderColor: "var(--border-soft)" }}>
                  {questions.map((q: any, i: number) => {
                    const ans = answers.find(a => a.questionId === q.id);
                    const isCorrect = ans?.isCorrect;
                    return (
                      <div key={q.id} className="p-4 rounded-2xl" style={{ background: isCorrect ? "var(--green-light)" : "var(--red-light)" }}>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isCorrect ? "var(--green)" : "var(--red)" }}>
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <XCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Q{i + 1}: {q.question}</p>
                            {!isCorrect && ans?.selectedAnswer && (
                              <p className="text-xs mb-0.5" style={{ color: "var(--red)" }}>
                                Your answer: <strong>{q.options.find((o: any) => o.id === ans.selectedAnswer)?.text ?? ans.selectedAnswer}</strong>
                              </p>
                            )}
                            <p className="text-xs" style={{ color: isCorrect ? "var(--green)" : "var(--text-2)" }}>
                              Correct: <strong>{q.options.find((o: any) => o.id === q.correctAnswer)?.text ?? q.correctAnswer}</strong>
                            </p>
                            {q.explanation && (
                              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>💡 {q.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feedback */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <button onClick={() => setShowFeedback(!showFeedback)} className="w-full flex items-center justify-between p-5 font-bold text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit',sans-serif" }}>
            <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" style={{ color: "var(--violet)" }} /> Rate this Quiz</span>
            {showFeedback ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
          </button>

          <AnimatePresence>
            {showFeedback && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "var(--border-soft)" }}>
                  {feedbackSaved ? (
                    <div className="py-4 text-center">
                      <p className="text-2xl mb-2">🙏</p>
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Thanks for your feedback!</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>We'll use it to improve future quizzes</p>
                    </div>
                  ) : (
                    <>
                      <div className="pt-2">
                        <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>How was this quiz?</p>
                        <StarRating value={rating} onChange={setRating} />
                      </div>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} className="textarea w-full text-sm" rows={3} placeholder="Any suggestions? What could be better?" />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Would retake?</span>
                        <button onClick={() => setWouldRetake(!wouldRetake)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: wouldRetake ? "var(--blue)" : "var(--border)" }}>
                          <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: wouldRetake ? "22px" : "2px" }} />
                        </button>
                      </div>
                      <button onClick={handleFeedback} disabled={!rating} className="btn-primary btn w-full">Submit Feedback</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
