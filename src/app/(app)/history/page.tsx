"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { getMyAttempts } from "@/lib/supabase";
import { fmtTime } from "@/lib/ai";
import { History, Search, TrendingUp, TrendingDown, Clock, Trophy, RefreshCw, ChevronRight, BookOpen } from "lucide-react";

export default function HistoryPage() {
  const { user } = useUser();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"all" | "learning" | "test">("all");
  const [sort, setSort] = useState<"date" | "score" | "topic">("date");

  useEffect(() => {
    if (user?.id) getMyAttempts(user.id, 100).then(setAttempts).finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = attempts
    .filter(a => {
      const topic: string = a.quizzes?.topic ?? "";
      const title: string = a.quizzes?.title ?? "";
      const matchSearch = topic.toLowerCase().includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase());
      const matchMode = mode === "all" || a.mode === mode;
      return matchSearch && matchMode;
    })
    .sort((a, b) => {
      if (sort === "date") return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      if (sort === "score") return b.percentage - a.percentage;
      return (a.quizzes?.topic ?? "").localeCompare(b.quizzes?.topic ?? "");
    });

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
            <History className="w-6 h-6" style={{ color: "var(--blue)" }} /> Quiz History
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{attempts.length} total attempts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search by topic…" />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
          {(["all", "learning", "test"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text)" : "var(--text-muted)", boxShadow: mode === m ? "var(--shadow-sm)" : "none" }}>
              {m}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="input text-sm w-auto pr-8">
          <option value="date">Latest first</option>
          <option value="score">Best score first</option>
          <option value="topic">By topic</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          {search
            ? <><Search className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border)" }} /><p className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>No results</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Try a different search term</p></>
            : <><BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border)" }} /><p className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>No history yet</p><p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Take your first quiz to see it here</p><Link href="/create" className="btn-primary btn">Create a Quiz</Link></>
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => {
            const pct = Math.round(a.percentage);
            const good = pct >= 70;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                {/* Score */}
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: good ? "var(--green-light)" : "var(--red-light)" }}>
                  <span className="text-lg font-black" style={{ fontFamily: "'Outfit',sans-serif", color: good ? "var(--green)" : "var(--red)" }}>{pct}%</span>
                  {good ? <TrendingUp className="w-3 h-3" style={{ color: "var(--green)" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "var(--red)" }} />}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{a.quizzes?.title ?? a.quizzes?.topic ?? "Quiz"}</h3>
                    <span className="badge text-xs" style={{ background: a.mode === "learning" ? "var(--violet-light)" : "var(--amber-light)", color: a.mode === "learning" ? "var(--violet)" : "var(--amber)" }}>{a.mode}</span>
                    <span className="badge text-xs" style={{ background: a.quizzes?.difficulty === "easy" ? "var(--green-light)" : a.quizzes?.difficulty === "hard" ? "var(--red-light)" : "var(--amber-light)", color: a.quizzes?.difficulty === "easy" ? "var(--green)" : a.quizzes?.difficulty === "hard" ? "var(--red)" : "var(--amber)" }}>{a.quizzes?.difficulty ?? "medium"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{a.score}/{a.total_questions}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(a.time_taken)}</span>
                    <span>{new Date(a.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {a.quiz_id && (
                    <Link href={`/quiz/${a.quiz_id}?retake=true`} className="btn-ghost btn btn-sm flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Retake
                    </Link>
                  )}
                  <Link href={`/results/${a.id}?quizId=${a.quiz_id}`} className="btn-secondary btn btn-sm flex items-center gap-1">
                    Review <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
