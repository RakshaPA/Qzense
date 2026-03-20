"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { Brain, Zap, Sparkles, Loader2, BookOpen, List, Clock, Search } from "lucide-react";
import { getMyQuizzes, saveQuiz, supabase } from "@/lib/supabase";
import { generateQuestions } from "@/lib/ai";
import { Quiz, Difficulty, QuizMode } from "@/types";

const DIFFICULTIES: { v: Difficulty; label: string; color: string }[] = [
  { v: "easy", label: "Easy", color: "var(--green)" },
  { v: "medium", label: "Medium", color: "var(--amber)" },
  { v: "hard", label: "Hard", color: "var(--red)" },
];

export default function TakeQuizPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<"ai" | "existing">("ai");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<QuizMode>("learning");
  const [generating, setGenerating] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [search, setSearch] = useState("");
  const [quizTab, setQuizTab] = useState<"my" | "public">("my");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const mine = await getMyQuizzes(user.id);
        setMyQuizzes(mine);
        if (supabase) {
          const { data } = await supabase.from("quizzes").select("*").eq("is_public", true).order("created_at", { ascending: false }).limit(50);
          setPublicQuizzes((data ?? []).map((d: Record<string, unknown>) => ({
            id: d.id as string, title: d.title as string, topic: d.topic as string,
            description: d.description as string | undefined,
            difficulty: d.difficulty as Quiz["difficulty"],
            questions: d.questions as Quiz["questions"],
            createdBy: d.user_id as string,
            createdAt: d.created_at as string, updatedAt: d.updated_at as string,
            isPublic: d.is_public as boolean,
            shareCode: d.share_code as string | undefined,
            timeLimit: d.time_limit as number | undefined,
          })));
        }
      } finally { setLoadingQuizzes(false); }
    };
    fetchData();
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Please enter a topic");
    if (!user?.id) return;
    setGenerating(true);
    try {
      const questions = await generateQuestions({
        topic, count, difficulty,
        types: ["mcq"],
        typeCounts: { mcq: count, "true-false": 0, "fill-blank": 0 },
      });
      const quiz: Quiz = {
        id: uuidv4(), title: topic, topic, difficulty, questions,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
      };
      await saveQuiz(quiz);
      toast.success(`${questions.length} questions ready!`);
      router.push(`/quiz/${quiz.id}?mode=${mode}`);
    } catch (e) {
      console.error("Generate error:", e);
      toast.error(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally { setGenerating(false); }
  };

  const diffStyle: Record<string, React.CSSProperties> = {
    easy: { background: "var(--green-light)", color: "var(--green)" },
    medium: { background: "var(--amber-light)", color: "var(--amber)" },
    hard: { background: "var(--red-light)", color: "var(--red)" },
  };

  const activeList = quizTab === "my" ? myQuizzes : publicQuizzes;
  const filtered = activeList.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Take a Quiz</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Generate a new quiz with AI or pick an existing one</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-7 w-fit" style={{ background: "var(--bg-subtle)" }}>
        <button onClick={() => setTab("ai")} className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2" style={{ background: tab === "ai" ? "var(--bg-card)" : "transparent", color: tab === "ai" ? "var(--text)" : "var(--text-muted)", boxShadow: tab === "ai" ? "var(--shadow-sm)" : "none" }}>
          <Sparkles className="w-4 h-4" /> Generate with AI
        </button>
        <button onClick={() => setTab("existing")} className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2" style={{ background: tab === "existing" ? "var(--bg-card)" : "transparent", color: tab === "existing" ? "var(--text)" : "var(--text-muted)", boxShadow: tab === "existing" ? "var(--shadow-sm)" : "none" }}>
          <BookOpen className="w-4 h-4" /> Existing Quizzes
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "ai" && (
          <motion.div key="ai" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="card p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>Topic *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} className="input" placeholder="e.g. World War 2, Python basics, Human anatomy..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-2)" }}>Difficulty</label>
              <div className="flex gap-3">
                {DIFFICULTIES.map(d => (
                  <button key={d.v} onClick={() => setDifficulty(d.v)} className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all" style={{ borderColor: difficulty === d.v ? d.color : "var(--border)", color: difficulty === d.v ? d.color : "var(--text-muted)", background: difficulty === d.v ? `color-mix(in srgb, ${d.color} 12%, transparent)` : "var(--bg-card)" }}>{d.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-2)" }}>Number of Questions: <span style={{ color: "var(--blue)" }}>{count}</span></label>
              <input type="range" min={5} max={20} value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}><span>5</span><span>20</span></div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-2)" }}>Quiz Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMode("learning")} className="p-4 rounded-2xl border-2 text-left transition-all" style={{ borderColor: mode === "learning" ? "var(--violet)" : "var(--border)", background: mode === "learning" ? "var(--violet-light)" : "var(--bg-card)" }}>
                  <Brain className="w-5 h-5 mb-2" style={{ color: "var(--violet)" }} />
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Learning Mode</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Hints, explanations and feedback after each question</p>
                </button>
                <button onClick={() => setMode("test")} className="p-4 rounded-2xl border-2 text-left transition-all" style={{ borderColor: mode === "test" ? "var(--amber)" : "var(--border)", background: mode === "test" ? "var(--amber-light)" : "var(--bg-card)" }}>
                  <Zap className="w-5 h-5 mb-2" style={{ color: "var(--amber)" }} />
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Test Mode</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>No hints, strict scoring, results at the end only</p>
                </button>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={generating || !topic.trim()} className="btn-primary btn w-full py-4 text-base">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating your quiz...</> : <><Sparkles className="w-5 h-5" /> Generate and Start Quiz</>}
            </button>
          </motion.div>
        )}

        {tab === "existing" && (
          <motion.div key="existing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: "var(--bg-subtle)" }}>
              {(["my", "public"] as const).map(t => (
                <button key={t} onClick={() => setQuizTab(t)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: quizTab === t ? "var(--bg-card)" : "transparent", color: quizTab === t ? "var(--text)" : "var(--text-muted)", boxShadow: quizTab === t ? "var(--shadow-sm)" : "none" }}>
                  {t === "my" ? "My Quizzes" : "Public Quizzes"}
                </button>
              ))}
            </div>
            <div className="relative mb-5">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-11 text-sm py-3" placeholder="Search by title or topic..." />
            </div>
            {loadingQuizzes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border)" }} />
                <p className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>{search ? "No results found" : quizTab === "my" ? "No quizzes yet" : "No public quizzes yet"}</p>
                <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{quizTab === "my" ? "Create a quiz first then take it here" : "Be the first to share a quiz!"}</p>
                <button onClick={() => setTab("ai")} className="btn-primary btn"><Sparkles className="w-4 h-4" /> Generate with AI</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm leading-snug" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{q.title}</h3>
                      <span className="badge text-xs flex-shrink-0" style={diffStyle[q.difficulty]}>{q.difficulty}</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{q.topic}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1"><List className="w-3 h-3" /> {q.questions.length} questions</span>
                      {q.timeLimit ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {q.timeLimit} min</span> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button onClick={() => router.push(`/quiz/${q.id}?mode=learning`)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{ background: "var(--violet-light)", color: "var(--violet)", border: "1px solid var(--violet)" }}><Brain className="w-3.5 h-3.5" /> Learning</button>
                      <button onClick={() => router.push(`/quiz/${q.id}?mode=test`)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{ background: "var(--amber-light)", color: "var(--amber)", border: "1px solid var(--amber)" }}><Zap className="w-3.5 h-3.5" /> Test</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
