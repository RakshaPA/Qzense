import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Brain } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(ellipse, #3b82f6, #8b5cf6, transparent)" }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Qzense</span>
          </Link>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>Welcome back</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sign in to continue your learning journey</p>
        </div>
        <style>{`
          .cl-headerTitle, .cl-headerSubtitle { display: none !important; }
          .cl-logoBox { display: none !important; }
        `}</style>
        <SignIn />
      </div>
    </div>
  );
}
