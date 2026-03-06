"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/lib/supabase/client";

const REDEMPTION_THRESHOLD = 10_000;

type Transaction = {
    id: string;
    amount: number;
    type: string;
    note: string | null;
    created_at: string;
};

function txLabel(type: string) {
    const map: Record<string, string> = {
        task_reward: "Task Reward", bonus: "Bonus",
        deduction: "Deduction", withdrawal_request: "Withdrawal Request",
    };
    return map[type] ?? type;
}

export default function WalletPage() {
    const { user, profile } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [lifetimeEarned, setLifetimeEarned] = useState(0);
    const [pendingReview, setPendingReview] = useState(0);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        supabase
            .from("token_transactions")
            .select("id, amount, type, note, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(30)
            .then(({ data }) => {
                setTransactions((data ?? []) as Transaction[]);
                setLoading(false);
            });

        // Separate aggregate for lifetime earned — limit(30) would under-count
        supabase
            .rpc("get_lifetime_earned", { p_user_id: user.id })
            .then(({ data }) => {
                setLifetimeEarned(typeof data === "number" ? data : 0);
            });

        // Count tokens in pending review tasks
        supabase
            .from("tasks")
            .select("id, projects(reward_per_task)")
            .eq("assigned_to", user.id)
            .eq("status", "pending_review")
            .then(({ data }) => {
                let total = 0;
                for (const t of data ?? []) {
                    const proj = Array.isArray(t.projects) ? t.projects[0] : t.projects;
                    total += (proj as { reward_per_task?: number } | null)?.reward_per_task ?? 0;
                }
                setPendingReview(total);
            });
    }, [user]);

    const balance = profile?.token_balance ?? 0;
    const progress = Math.min((balance / REDEMPTION_THRESHOLD) * 100, 100);
    const remaining = Math.max(REDEMPTION_THRESHOLD - balance, 0);

    return (
        <PageShell topbar={<Topbar title={<h1 className="text-xl font-bold">My Wallet</h1>} />}>
            <div className="flex flex-col gap-6">

                {/* Balance hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard variant="purple" className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                                Current Token Balance
                            </span>
                            <span className="text-5xl font-extrabold leading-none">
                                {balance.toLocaleString()} <span className="text-3xl text-white/40">🪙</span>
                            </span>
                            <span className="text-sm text-white/50">
                                ≈ ₹{(balance / 10).toFixed(0)} redeemable once milestone is reached
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: "Lifetime Earned", value: lifetimeEarned.toLocaleString(), color: "text-emerald-400" },
                                { label: "Pending Review", value: pendingReview.toLocaleString(), color: "text-amber-400" },
                                { label: "Tasks Done", value: String(profile?.tasks_completed ?? 0), color: "text-violet-300" },
                            ].map((s) => (
                                <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.06] px-5 py-4 text-center">
                                    <span className="text-xs text-white/40">{s.label}</span>
                                    <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Redemption banner */}
                <div className="flex items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-5 py-3.5">
                    <span className="text-xl">⏳</span>
                    <div>
                        <p className="text-sm font-semibold text-amber-400">
                            Redemption Unlocks at {REDEMPTION_THRESHOLD.toLocaleString()} Tokens
                        </p>
                        <p className="mt-0.5 text-xs text-white/50">
                            {remaining > 0
                                ? `You need ${remaining.toLocaleString()} more tokens. Keep completing tasks!`
                                : "🎉 You've reached the redemption threshold! Contact admin to withdraw."}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/50">Progress to redemption</span>
                        <span className="font-semibold text-violet-300">{balance.toLocaleString()} / {REDEMPTION_THRESHOLD.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                        />
                    </div>
                </div>

                {/* Transaction history */}
                <GlassCard className="flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                        <h3 className="text-base font-semibold">Transaction History</h3>
                        <span className="text-xs text-white/40">Last 30 transactions</span>
                    </div>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-14 animate-pulse border-b border-white/[0.05] px-5 py-3.5" />
                        ))
                    ) : transactions.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-white/40">No transactions yet. Earn tokens by completing tasks!</p>
                    ) : (
                        transactions.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5 last:border-0"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm text-white/85">{t.note ?? txLabel(t.type)}</span>
                                    <span className="text-xs text-white/35">
                                        {new Date(t.created_at).toLocaleDateString([], { dateStyle: "medium" })} · {txLabel(t.type)}
                                    </span>
                                </div>
                                <span className={`text-sm font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {t.amount >= 0 ? "+" : ""}{t.amount} 🪙
                                </span>
                            </motion.div>
                        ))
                    )}
                </GlassCard>
            </div>
        </PageShell>
    );
}
