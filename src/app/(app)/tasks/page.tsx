"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/lib/supabase/client";

type Task = {
    id: string;
    title: string;
    status: string;
    project_id: string;
    expires_at: string | null;
    projects: { title: string; reward_per_task: number } | null;
};

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

export default function MyTasksPage() {
    const { user } = useUser();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();
        supabase
            .from("tasks")
            .select("id, title, status, project_id, expires_at, projects(title, reward_per_task)")
            .eq("assigned_to", user.id)
            .order("assigned_at", { ascending: false })
            .then(({ data }) => {
                const rows = ((data ?? []) as unknown[]).map((t: unknown) => {
                    const row = t as { id: string; title: string; status: string; project_id: string; expires_at: string | null; projects: { title: string; reward_per_task: number }[] | { title: string; reward_per_task: number } | null };
                    return {
                        ...row,
                        projects: Array.isArray(row.projects) ? (row.projects[0] ?? null) : row.projects,
                    } as Task;
                });
                setTasks(rows);
                setLoading(false);
            });
    }, [user]);

    return (
        <PageShell
            topbar={
                <Topbar
                    title={<h1 className="text-xl font-bold">My Tasks</h1>}
                    right={
                        <Link href="/projects">
                            <button className="btn-primary rounded-xl px-5 py-2.5 text-sm">+ Claim New Task</button>
                        </Link>
                    }
                />
            }
        >
            <div className="flex flex-col gap-3">
                {loading ? (
                    // Skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
                    ))
                ) : tasks.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList size={32} className="text-white/30" />}
                        title="No tasks yet"
                        description="You haven't claimed any tasks. Browse open projects and grab one to start earning."
                        actionLabel="Browse Projects"
                        actionHref="/projects"
                    />
                ) : (
                    tasks.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <Link href={`/projects/${t.project_id}/tasks/${t.id}`}>
                                <GlassCard className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.07] transition-colors cursor-pointer">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{t.title || `Task ${t.id.slice(0, 6)}`}</p>
                                        <p className="mt-0.5 text-xs text-white/40">
                                            {t.projects?.title ?? "—"}
                                            {t.expires_at && t.status === "assigned" && (
                                                <span className="ml-2 text-amber-400/80">
                                                    · expires {new Date(t.expires_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex flex-shrink-0 items-center gap-5">
                                        {t.projects?.reward_per_task && (
                                            <span className="text-sm font-semibold text-emerald-400">+{t.projects.reward_per_task} 🪙</span>
                                        )}
                                        <Badge variant={statusVariant(t.status)}>{statusLabel(t.status)}</Badge>
                                    </div>
                                </GlassCard>
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </PageShell>
    );
}
