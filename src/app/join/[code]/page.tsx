"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuizByShareCode } from "@/lib/supabase";
import { Loader2, AlertTriangle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    getQuizByShareCode(code.toUpperCase()).then(quiz => {
      if (!quiz) { setError("Quiz not found or no longer public."); return; }
      router.replace(`/quiz/${quiz.id}`);
    }).catch(() => setError("Could not load quiz. Please try again."));
  }, [code]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center max-w-sm w-full">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
        <h2 className="text-xl font-black mb-2" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Oops!</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={() => router.push("/")} className="btn-primary btn w-full">Go to Home</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-400 to-violet-600 flex items-center justify-center mx-auto mb-4 animate-float shadow-glow">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" style={{ color: "var(--blue)" }} />
        <p className="font-semibold" style={{ color: "var(--text)" }}>Loading quiz…</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Code: <strong>{code.toUpperCase()}</strong></p>
      </div>
    </div>
  );
}
