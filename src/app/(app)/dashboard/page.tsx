"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getUserStats } from "@/lib/supabase";
import { fmtTime } from "@/lib/ai";
import { UserStats } from "@/types";
import {
  Trophy, Flame, Target, Zap, Plus, BookOpen,
  TrendingUp, TrendingDown, ChevronRight, Clock, Star, BarChart3,
  Sparkles, PenLine, Gamepad2, History,
} from "lucide-react";

function Stat({ icon: Icon, label, value, sub, grad }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  grad: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-2xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function SkeletonStat() {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="skeleton w-11 h-11 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-7 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) getUserStats(user.id).then(setStats).finally(() => setLoading(false));
  }, [user?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const radarData = stats?.topicStats.slice(0, 6).map((t) => ({
    topic: t.topic.length > 10 ? t.topic.slice(0, 10) + "..." : t.topic,
    score: t.avgScore,
  })) ?? [];

  const quickActions = [
    { href: "/create", icon: Sparkles, label: "AI Quiz Generator", desc: "Generate quiz on any topic instantly", color: "from-blue-400 to-blue-600" },
    { href: "/create?manual=true", icon: PenLine, label: "Build Manually", desc: "Write and customize your own questions", color: "from-violet-400 to-violet-600" },
    { href: "/explore", icon: Gamepad2, label: "Take a Quiz", desc: "Browse and take quizzes in learning or test mode", color: "from-violet-400 to-purple-600" },
    { href: "/history", icon: History, label: "Review History", desc: "See all your past attempts and scores", color: "from-emerald-400 to-emerald-600" },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-black mb-1"
            style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
            {greeting}, {user?.firstName ?? "Learner"} 👋
          </motion.h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/create" className="btn-primary btn hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> New Quiz
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <Stat icon={Trophy} label="Quizzes Taken" value={stats?.totalAttempts ?? 0} sub="all time" grad="from-blue-400 to-blue-600" />
            <Stat icon={Target} label="Avg Score" value={`${stats?.averageScore ?? 0}%`} sub="across all topics" grad="from-violet-400 to-violet-600" />
            <Stat icon={Flame} label="Day Streak" value={stats?.streak ?? 0} sub={stats?.streak ? "keep it going!" : "start today!"} grad="from-orange-400 to-red-500" />
            <Stat icon={Zap} label="Questions Done" value={stats?.totalQuestions ?? 0} sub={`${stats?.totalCorrect ?? 0} correct`} grad="from-emerald-400 to-emerald-600" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

        {/* Radar chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: "var(--blue)" }} />
            <h3 className="font-bold text-sm" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
              Topic Performance
            </h3>
          </div>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "'DM Sans'" }} />
                <Radar dataKey="score" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.18} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
              <BarChart3 className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Take quizzes on 3 or more topics to see your radar chart
              </p>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
              Achievements
            </h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (stats?.achievements.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {stats!.achievements.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-subtle)" }}>
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{a.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
              <Trophy className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Complete quizzes to earn achievements!</p>
              <Link href="/create" className="btn-primary btn btn-sm">Start Now</Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--violet)" }} />
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
                Recent Activity
              </h3>
            </div>
            <Link href="/history" className="text-xs font-semibold" style={{ color: "var(--blue)" }}>
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (stats?.recentAttempts.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {stats!.recentAttempts.map((h, i) => {
                const pct = (h.attempt as { percentage: number }).percentage;
                const good = pct >= 70;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: "var(--bg-subtle)" }}>
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: good ? "var(--green-light)" : "var(--red-light)",
                        color: good ? "var(--green)" : "var(--red)",
                      }}>
                      {Math.round(pct)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                        {(h.quiz as { topic: string } | null)?.topic ?? "Quiz"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fmtTime((h.attempt as { time_taken: number }).time_taken)}
                      </p>
                    </div>
                    {good
                      ? <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--green)" }} />
                      : <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--red)" }} />
                    }
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
              <BookOpen className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No quizzes taken yet</p>
              <Link href="/create" className="btn-primary btn btn-sm">Take your first quiz</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-black text-base mb-4" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="card-lift p-5 flex items-center gap-4 group">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm mb-0.5" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
                  {a.label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile FAB */}
      <Link href="/create" className="lg:hidden fixed bottom-6 right-6 btn-primary btn w-14 h-14 rounded-2xl shadow-lg z-30 flex items-center justify-center p-0">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}