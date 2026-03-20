"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, LayoutDashboard, Plus, History, Compass, Sun, Moon, Menu, X, ChevronRight, Flame } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create",    label: "Create Quiz", icon: Plus },
  { href: "/history",   label: "My History",  icon: History },
  { href: "/explore",   label: "Explore",     icon: Compass },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "" : ""}`}>
      {/* Logo */}
      <div className="p-5 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Qzense</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <Link
              key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative"
              style={{
                background: active ? "var(--blue-light)" : "transparent",
                color: active ? "var(--blue)" : "var(--text-2)",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-500" />}
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{ color: "var(--text-muted)", fontFamily: "'Outfit',sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ borderTop: `1px solid var(--border-soft)`, marginTop: "4px", paddingTop: "12px" }}>
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
              {user?.firstName ?? "Student"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 border-r" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Qzense</span>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="btn-ghost btn btn-icon">
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(true)} className="btn-ghost btn btn-icon">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r lg:hidden"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 btn-ghost btn btn-icon">
                <X className="w-4 h-4" />
              </button>
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="page-in">{children}</div>
      </main>
    </div>
  );
}
