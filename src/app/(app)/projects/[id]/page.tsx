"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Badge from "@/components/Badge";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";

type Task = {
    id: string;
    sceneNumber: number;
    title: string;
    prompt: string;
    status: "open" | "assigned" | "submitted" | "pending_review" | "approved" | "rejected" | "expired";
};

type Project = {
    id: string;
    title: string;
    description: string | null;
    styleGuide: string | null;
    resolution: string;
    aspectRatio: string;
    clipDurationS: number;
    suggestedModels: string[] | null;
    rewardPerTask: number;
    tasks: Task[];
};

function taskBadge(status: Task["status"]) {
    switch (status) {
        case "open": return <Badge variant="purple">▶ Available</Badge>;
        case "assigned": return <Badge variant="amber">⏳ Claimed</Badge>;
        case "pending_review": return <Badge variant="cyan">👁 In Review</Badge>;
        case "approved": return <Badge variant="green">✓ Done</Badge>;
        case "rejected": return <Badge variant="red">✗ Rejected</Badge>;
        default: return <Badge variant="gray">Expired</Badge>;
    }
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then((r) => {
                if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
                return r.json();
            })
            .then((data) => {
                if (data) { setProject(data); setLoading(false); }
            })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id]);

    const title = loading ? "Loading…" : project?.title ?? "Not Found";

    return (
        <PageShell
            topbar={
                <Topbar
                    title={
                        <div className="flex items-center gap-3">
                            <Link href="/projects" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                                <ArrowLeft size={15} /> Projects
                            </Link>
                            <span className="text-white/20">/</span>
                            <h1 className="text-lg font-bold line-clamp-1">{title}</h1>
                        </div>
                    }
                />
            }
        >
            {/* Loading skeleton */}
            {loading && (
                <div className="flex flex-col gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Not found */}
            {!loading && notFound && (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400/60" />
                    <p className="text-white/60">Project not found</p>
                    <Link href="/projects" className="text-sm text-violet-400 hover:text-violet-300">← Back to Projects</Link>
                </div>
            )}

            {/* Task list */}
            {!loading && project && (
                <div className="flex flex-col gap-4">
                    {/* Project meta */}
                    <GlassCard className="flex flex-col gap-3">
                        {project.description && (
                            <p className="text-sm text-white/70 leading-relaxed">{project.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-white/50">
                            <span>📐 {project.resolution} · {project.aspectRatio}</span>
                            <span>⏱ {project.clipDurationS}s clips</span>
                            <span>🤖 {(project.suggestedModels ?? []).join(", ") || "AI Video"}</span>
                            <span>💰 ₹{project.rewardPerTask} per clip</span>
                            <span>📋 {project.tasks.filter(t => t.status === "open").length}/{project.tasks.length} tasks open</span>
                        </div>
                        {project.styleGuide && (
                            <details className="text-xs text-white/40">
                                <summary className="cursor-pointer hover:text-white/60 transition-colors">📖 Style Guide</summary>
                                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{project.styleGuide}</p>
                            </details>
                        )}
                    </GlassCard>

                    <p className="text-sm text-white/50">Select an available task below to get started:</p>

                    {project.tasks.length === 0 && (
                        <p className="text-white/30 text-sm text-center py-8">No tasks in this project yet.</p>
                    )}

                    {project.tasks.map((task, i) => {
                        const isClickable = task.status === "open";
                        const card = (
                            <GlassCard
                                className={`flex flex-col gap-4 p-6 transition-all sm:flex-row sm:items-start sm:justify-between
                                    ${isClickable ? "hover:bg-violet-500/[0.06] cursor-pointer" : "opacity-60 cursor-default"}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold">{task.title || `Scene ${task.sceneNumber}`}</h3>
                                    <p className="mt-2 text-[13px] leading-relaxed text-white/45 line-clamp-2">{task.prompt}</p>
                                </div>
                                <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:flex-shrink-0 sm:ml-6">
                                    <span className="text-lg font-bold text-emerald-400">₹{project.rewardPerTask}</span>
                                    {taskBadge(task.status)}
                                </div>
                            </GlassCard>
                        );

                        return (
                            <motion.div key={task.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                {isClickable
                                    ? <Link href={`/projects/${id}/tasks/${task.id}`} className="block">{card}</Link>
                                    : card
                                }
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </PageShell>
    );
}
