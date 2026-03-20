"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Sparkles, ArrowRight, BookOpen, Zap, Trophy, BarChart3, MessageCircle, Lock } from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
              QZense
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <button onClick={() => router.push("/dashboard")} className="btn-primary btn">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link href="/sign-in" className="btn-ghost btn text-sm font-semibold">Sign in</Link>
                <Link href="/sign-up" className="btn-primary btn">Get Started <ArrowRight className="w-4 h-4" /></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-5 py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(ellipse, #3b82f6 0%, #8b5cf6 40%, transparent 70%)" }} />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 badge-blue">
            <Sparkles className="w-3.5 h-3.5" /> Powered by AI
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight"
            style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
            Learn smarter with<br />
            <span className="gradient-text">AI-powered quizzes</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-2)" }}>
            Generate quizzes on any topic instantly. Practice in learning or test mode. Track your progress and never stop improving.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/sign-up" className="btn-primary btn px-8 py-4 text-base rounded-2xl font-bold">
              Sign Up <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/sign-in" className="btn-secondary btn px-8 py-4 text-base rounded-2xl font-bold">
              <BookOpen className="w-5 h-5" /> Sign In
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Sparkles, label: "AI Generation" },
              { icon: BookOpen, label: "Learning Mode" },
              { icon: Zap, label: "Test Mode" },
              { icon: Trophy, label: "Achievements" },
              { icon: BarChart3, label: "Analytics" },
              { icon: MessageCircle, label: "AI Chatbot" },
              { icon: Lock, label: "Secure Auth" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                <f.icon className="w-3 h-3" style={{ color: "var(--blue)" }} />
                {f.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <footer className="py-5 px-5 border-t text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © 2025 QZense · AI-Powered Quiz Platform 💙
      </footer>
    </div>
  );
}
