"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Badge from "@/components/Badge";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import { useUser } from "@/components/UserProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TaskRow = {
    id: string;
    title: string;
    status: string;
    project_id: string;
};

type ProjectRow = {
    id: string;
    title: string;
    reward_per_task: number;
    status: string;
};

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function statusVariant(status: string): "green" | "amber" | "purple" | "cyan" | "red" {
    if (status === "approved") return "green";
    if (status === "pending_review") return "amber";
    if (status === "assigned") return "purple";
    if (status === "rejected") return "red";
    return "cyan";
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        approved: "Approved", pending_review: "In Review",
        assigned: "Assigned", rejected: "Rejected", submitted: "Submitted",
    };
    return map[status] ?? status;
}

export default function DashboardPage() {
    const { user, profile } = useUser();
    const [recentTasks, setRecentTasks] = useState<TaskRow[]>([]);
    const [projects, setProjects] = useState<ProjectRow[]>([]);
    const [rank, setRank] = useState<number | null>(null);
    const [activeTasks, setActiveTasks] = useState(0);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        // Fetch recent tasks
        supabase
            .from("tasks")
            .select("id, title, status, project_id")
            .eq("assigned_to", user.id)
            .order("assigned_at", { ascending: false })
            .limit(4)
            .then(({ data }) => {
                setRecentTasks(data ?? []);
                setActiveTasks((data ?? []).filter((t) => t.status === "assigned").length);
            });

        // Fetch active projects (public)
        supabase
            .from("projects")
            .select("id, title, reward_per_task, status")
            .eq("status", "active")
            .limit(3)
            .then(({ data }) => setProjects(data ?? []));

        // Get leaderboard rank (use API, not full profile table scan)
        fetch(`/api/leaderboard?period=all`)
            .then((r) => r.json())
            .then(({ leaderboard }) => {
                if (!Array.isArray(leaderboard)) return;
                const pos = leaderboard.findIndex((p: { id: string }) => p.id === user.id);
                if (pos !== -1) setRank(pos + 1);
            });
    }, [user]);

    const firstName = (profile?.display_name ?? user?.user_metadata?.full_name ?? "there").split(" ")[0];

    const stats = [
        { label: "Token Balance", value: (profile?.token_balance ?? 0).toLocaleString(), sub: "🪙 total earned", color: "text-cyan-400" },
        { label: "Tasks Completed", value: String(profile?.tasks_completed ?? 0), sub: "all time", color: "text-white" },
        { label: "Active Tasks", value: String(activeTasks), sub: "currently assigned", color: "text-amber-400" },
        { label: "Leaderboard Rank", value: rank ? `#${rank}` : "—", sub: "by token balance", color: "text-violet-300" },
    ];

    return (
        <PageShell
            topbar={<Topbar title={<h1 className="text-xl font-bold">Dashboard</h1>} showUserAvatar />}
        >
            <div className="flex flex-col gap-6">
                {/* Greeting */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{greeting()}, {firstName} 👋</h2>
                        <p className="mt-1 text-sm text-white/50">Here's how your earnings are looking today</p>
                    </div>
                    <Link
                        href="/projects"
                        className="btn-primary rounded-xl px-5 py-2.5 text-sm"
                    >
                        Browse Tasks →
                    </Link>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((s, i) => (
                        <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} valueColor={s.color} delay={i * 0.08} />
                    ))}
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
                    {/* Recent tasks */}
                    <GlassCard className="flex flex-col">
                        <div className="flex items-center justify-between px-5 pt-5 pb-4">
                            <h3 className="text-base font-semibold">My Recent Tasks</h3>
                            <Link href="/tasks" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
                        </div>
                        {recentTasks.length === 0 ? (
                            <p className="px-5 pb-5 text-sm text-white/40">No tasks yet — browse projects to claim one.</p>
                        ) : (
                            recentTasks.map((t) => (
                                <div key={t.id} className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5">
                                    <span className="text-sm text-white/85 truncate">{t.title || `Task ${t.id.slice(0, 6)}`}</span>
                                    <Badge variant={statusVariant(t.status)}>{statusLabel(t.status)}</Badge>
                                </div>
                            ))
                        )}
                    </GlassCard>

                    {/* Active projects */}
                    <GlassCard className="flex flex-col gap-4 p-5">
                        <h3 className="text-base font-semibold">Open Projects</h3>
                        {projects.length === 0 ? (
                            <p className="text-sm text-white/40">No active projects right now.</p>
                        ) : (
                            projects.map((p) => (
                                <Link key={p.id} href={`/projects/${p.id}`}>
                                    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] transition-colors cursor-pointer">
                                        <p className="text-sm font-semibold">{p.title}</p>
                                        <p className="text-xs text-white/50">🪙 {p.reward_per_task} tokens/task</p>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                            {(() => {
                                                const approved = recentTasks.filter(t => t.status === "approved").length;
                                                const total = recentTasks.length;
                                                const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                                                return (
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                        className="h-1.5 rounded-full bg-violet-500"
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </GlassCard>
                </div>
            </div>
        </PageShell>
    );
}
