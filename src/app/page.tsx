"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

const howItWorks = [
  { n: "01", t: "Claim a Task", d: "Browse open AI video tasks from real YouTube channels. Each task has a clear brief, prompt, and reward in tokens." },
  { n: "02", t: "Generate the Clip", d: "Use the provided AI prompt on any free tool — Kling AI, Runway, Hailuo, or Wan 2.1. Takes 15–30 minutes." },
  { n: "03", t: "Earn Tokens", d: "Submit your Google Drive link. Once reviewed and approved, tokens land in your wallet instantly." },
];

const features = [
  { e: "🎥", t: "Zero Investment", d: "Use AI tools you already have free access to. No subscriptions needed." },
  { e: "⚡", t: "Quick Tasks", d: "Each task takes 15–30 mins. Claim, generate, upload, done." },
  { e: "🏆", t: "Token Rewards", d: "Earn tokens for every approved submission. Redeem once revenue flows." },
  { e: "🔗", t: "Trust System", d: "Build your trust level with quality work and unlock higher-value tasks." },
];

type Stats = { tasksCompleted: number; members: number; tokensAwarded: number };

function fmtNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}k+`;
  return n.toString();
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => { });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a1a]">
      {/* Mesh blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="mesh-blob h-[600px] w-[600px] bg-violet-600 opacity-20" style={{ top: -200, left: -100 }} />
        <div className="mesh-blob h-[500px] w-[500px] bg-cyan-500 opacity-15" style={{ top: 100, right: -150 }} />
        <div className="mesh-blob h-[400px] w-[400px] bg-violet-700 opacity-20" style={{ bottom: 0, left: "30%" }} />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-white/[0.06] bg-[#0a0a1a]/70 px-6 backdrop-blur-sm sm:px-16 lg:px-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-base">⚡</div>
            <span className="text-lg font-extrabold">Task Turkey</span>
          </div>
          <div className="hidden items-center gap-9 md:flex">
            {["How It Works", "Features", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} className="text-[15px] text-white/60 transition-colors hover:text-white">
                {l}
              </a>
            ))}
          </div>
          {/* D6: Link without nested button (inline styling) */}
          <Link href="/login" className="btn-primary rounded-xl px-5 py-2.5 text-sm">
            Sign In with Google →
          </Link>
        </nav>

        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 pb-24 text-center sm:px-16">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-5 py-1.5 text-[13px] text-violet-300">
              ✨ Free to Join · Zero Upfront Cost
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Turn Your Free AI Tools
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Into Real Earnings
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12 max-w-[600px] text-lg leading-relaxed text-white/60 sm:text-xl"
          >
            Generate AI videos for real YouTube channels. Earn tokens for every approved clip. Redeem for cash once the channel grows.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/login" className="btn-primary rounded-xl px-8 py-3.5 text-base">
              Start Earning — It&apos;s Free →
            </Link>
            <a href="#how-it-works" className="btn-outline rounded-xl px-8 py-3.5 text-base text-white">
              How It Works
            </a>
          </motion.div>

          {/* Stats — all live from /api/stats, no fake numbers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-12"
          >
            {[
              { v: stats ? fmtNumber(stats.tasksCompleted) : "—", l: "Tasks Completed" },
              { v: stats ? fmtNumber(stats.tokensAwarded) : "—", l: "Tokens Awarded" },
              { v: stats ? fmtNumber(stats.members) : "—", l: "Active Members" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-3xl font-extrabold">{s.v}</p>
                <p className="mt-1 text-[13px] text-white/50">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 sm:px-16">
          <h2 className="mb-14 text-center text-4xl font-extrabold">How Task Turkey Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/20 text-lg font-black text-violet-300">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold">{s.t}</h3>
                <p className="text-[14px] leading-relaxed text-white/55">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 pb-20 sm:px-16">
          <h2 className="mb-14 text-center text-4xl font-extrabold">Why Creators Choose Task Turkey</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <span className="text-3xl">{f.e}</span>
                <h4 className="text-base font-semibold">{f.t}</h4>
                <p className="text-[13px] leading-relaxed text-white/50">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA banner — honest copy, no fake "thousands of creators" */}
        <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-16">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-violet-500/30 bg-violet-500/10 px-10 py-16 text-center">
            <h2 className="text-4xl font-extrabold">Ready to Start Earning?</h2>
            <p className="text-lg text-white/60">
              Join early — limited spots open as we grow. Claim a task and get your first tokens today.
            </p>
            <Link href="/login" className="btn-primary rounded-xl px-10 py-3.5 text-base">
              Join Task Turkey Free →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-white/[0.06] px-6 py-6 sm:px-20">
          <span className="text-sm font-semibold text-white/40">🦃 Task Turkey</span>
          <span className="text-xs text-white/30">© 2026 Task Turkey · Built for creators</span>
        </footer>
      </div>
    </div>
  );
}
