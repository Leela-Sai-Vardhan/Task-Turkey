"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Badge from "@/components/Badge";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import { useUser } from "@/components/UserProvider";

const timeTabs = ["Week", "Month", "All Time"] as const;
type TimeTab = typeof timeTabs[number];

const periodMap: Record<TimeTab, string> = {
    Week: "week",
    Month: "month",
    "All Time": "all",
};

type LeaderboardUser = {
    id: string;
    displayName: string;
    username: string;
    trustLevel: number;
    tokenBalance: number;
    tasksCompleted: number;
    approvalRate: number | null;
};

const trustLabels: Record<number, { label: string; variant: "green" | "amber" | "purple" | "cyan" | "red" }> = {
    1: { label: "Member", variant: "amber" },
    2: { label: "Verified", variant: "purple" },
    3: { label: "Trusted", variant: "cyan" },
    4: { label: "Senior", variant: "green" },
    5: { label: "Elite", variant: "green" },
};

const podiumColors = [
    { ring: "ring-yellow-400/60", text: "text-yellow-400", medal: "🥇", size: "w-20 h-20 text-2xl" },
    { ring: "ring-slate-300/60", text: "text-slate-300", medal: "🥈", size: "w-16 h-16 text-xl" },
    { ring: "ring-amber-600/60", text: "text-amber-500", medal: "🥉", size: "w-16 h-16 text-xl" },
];

const avatarBg = ["bg-violet-600", "bg-cyan-600", "bg-emerald-600", "bg-amber-600", "bg-pink-600", "bg-sky-600", "bg-indigo-600", "bg-rose-600"];

export default function LeaderboardPage() {
    const [tab, setTab] = useState<TimeTab>("All Time");
    const { user } = useUser();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?period=${periodMap[tab]}`)
            .then((r) => r.json())
            .then(({ leaderboard }) => {
                setUsers(Array.isArray(leaderboard) ? leaderboard : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [tab]);

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <PageShell
            topbar={
                <Topbar
                    title={<h1 className="text-xl font-bold">Leaderboard</h1>}
                    right={
                        <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/[0.04]">
                            {timeTabs.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-4 py-2 text-[13px] font-semibold transition-colors ${tab === t ? "bg-violet-600 text-white" : "text-white/50 hover:text-white/80"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    }
                />
            }
        >
            <div className="flex flex-col gap-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[0, 1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />)}
                    </div>
                ) : users.length === 0 ? (
                    <p className="py-16 text-center text-white/40">No ranked users yet for this period. Complete tasks to appear here!</p>
                ) : (
                    <>
                        {/* ── Top-3 Podium ── */}
                        {top3.length > 0 && (
                            <div className={`grid grid-cols-1 gap-4 ${top3.length >= 3 ? "sm:grid-cols-3" : top3.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1 sm:max-w-xs sm:mx-auto"}`}>
                                {top3.map((actual, i) => {
                                    const pc = podiumColors[i];
                                    const initial = actual.displayName.charAt(0).toUpperCase();
                                    const trust = trustLabels[actual.trustLevel] ?? trustLabels[1];
                                    const isCenter = i === 0;
                                    return (
                                        <motion.div
                                            key={actual.id}
                                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={isCenter && top3.length === 3 ? "sm:order-first sm:-mt-4" : ""}
                                        >
                                            <GlassCard className={`flex flex-col items-center gap-3 py-7 px-5 text-center ${isCenter && top3.length === 3 ? "border-yellow-400/20 sm:pb-9" : ""}`}>
                                                <span className="text-3xl">{pc.medal}</span>
                                                <div className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ${pc.ring} ${pc.size} ${avatarBg[i % avatarBg.length]}`}>
                                                    {initial}
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold">{actual.displayName}</p>
                                                    <p className="mt-0.5 text-xs text-white/40">Rank #{i + 1}</p>
                                                </div>
                                                <div className="flex w-full justify-center gap-6">
                                                    <div className="text-center">
                                                        <p className={`text-xl font-extrabold ${pc.text}`}>{actual.tokenBalance.toLocaleString()}</p>
                                                        <p className="text-[11px] text-white/40">tokens</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xl font-extrabold">{actual.tasksCompleted}</p>
                                                        <p className="text-[11px] text-white/40">tasks</p>
                                                    </div>
                                                </div>
                                                <Badge variant={trust.variant}>Lv{actual.trustLevel} · {trust.label}</Badge>
                                            </GlassCard>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Ranked Table ── */}
                        {rest.length > 0 && (
                            <GlassCard className="overflow-hidden">
                                <div className="border-b border-white/[0.06] px-5 py-3.5 grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center">
                                    {["#", "USER", "TASKS", "TOKENS", "TRUST"].map(h => (
                                        <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-white/30">{h}</span>
                                    ))}
                                </div>
                                {rest.map((u, i) => {
                                    const isCurrentUser = u.id === user?.id;
                                    const trust = trustLabels[u.trustLevel] ?? trustLabels[1];
                                    return (
                                        <motion.div
                                            key={u.id}
                                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center border-t border-white/[0.05] px-5 py-3.5 transition-colors ${isCurrentUser ? "bg-violet-500/[0.09] border-l-2 border-l-violet-500" : "hover:bg-white/[0.02]"}`}
                                        >
                                            <span className={`w-6 text-center text-sm font-bold ${isCurrentUser ? "text-violet-400" : "text-white/40"}`}>{i + 4}</span>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBg[i % avatarBg.length]}`}>
                                                    {u.displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <p className={`truncate text-sm font-medium ${isCurrentUser ? "text-violet-200" : "text-white/85"}`}>
                                                    {u.displayName}
                                                    {isCurrentUser && <span className="ml-1.5 text-[11px] text-violet-400">(You)</span>}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-white/70">{u.tasksCompleted}</span>
                                            <span className="text-sm font-bold text-cyan-400">{u.tokenBalance.toLocaleString()}</span>
                                            <Badge variant={trust.variant}>Lv{u.trustLevel}</Badge>
                                        </motion.div>
                                    );
                                })}
                            </GlassCard>
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}
