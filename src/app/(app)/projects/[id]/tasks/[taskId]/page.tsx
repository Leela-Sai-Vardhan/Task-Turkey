"use client";

import { use, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Copy, CheckCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/Badge";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";

type TaskStatus = "open" | "assigned" | "submitted" | "pending_review" | "approved" | "rejected" | "expired";

type TaskData = {
    id: string;
    sceneNumber: number;
    title: string;
    prompt: string;
    status: TaskStatus;
    assignedTo: string | null;
    expiresAt: string | null;
    currentUserId: string;
    project: {
        id: string;
        title: string;
        description: string | null;
        styleGuide: string | null;
        resolution: string;
        aspectRatio: string;
        clipDurationS: number;
        suggestedModels: string[] | null;
        rewardPerTask: number;
    };
};

type VerifyResult = {
    name: string;
    mimeType: string;
    sizeMb: string;
};

const steps = [
    "Copy the prompt above",
    "Go to Kling AI / Runway / Hailuo (any AI video tool is fine)",
    "Paste the prompt and generate your video",
    "Upload the video to your Google Drive",
    "Set sharing to 'Anyone with the link'",
    "Paste the Drive link below and verify it",
    "Submit your work for review",
];

export default function TaskDetailPage({
    params,
}: {
    params: Promise<{ id: string; taskId: string }>;
}) {
    const { id: projectId, taskId } = use(params);

    const [task, setTask] = useState<TaskData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [driveUrl, setDriveUrl] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState<VerifyResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchTask = useCallback(async () => {
        try {
            const r = await fetch(`/api/tasks/${taskId}`);
            if (r.status === 404) { setNotFound(true); setLoading(false); return; }
            const data: TaskData = await r.json();
            setTask(data);
            setLoading(false);
        } catch {
            setNotFound(true);
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => { fetchTask(); }, [fetchTask]);

    const handleCopy = () => {
        if (!task) return;
        navigator.clipboard.writeText(task.prompt);
        setCopied(true);
        toast.success("Prompt copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const r = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST" });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Failed to claim");
            toast.success("Task claimed! You have 24 hours to complete it.");
            await fetchTask();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to claim task");
        } finally {
            setClaiming(false);
        }
    };

    const handleVerify = async () => {
        if (!driveUrl.trim()) return;
        setVerifying(true);
        setVerified(null);
        try {
            const r = await fetch("/api/drive/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: driveUrl }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Verification failed");
            setVerified(data as VerifyResult);
            toast.success("Drive link verified ✓");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async () => {
        if (!verified) return;
        setSubmitting(true);
        try {
            const r = await fetch(`/api/tasks/${taskId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driveUrl }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Submission failed");
            toast.success("Submitted for review! Tokens will be credited after approval.");
            await fetchTask();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageShell topbar={<Topbar title={<span className="text-white/50">Loading…</span>} />}>
                <div className="flex flex-col gap-4">
                    <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-60 rounded-2xl bg-white/5 animate-pulse" />
                </div>
            </PageShell>
        );
    }

    if (notFound || !task) {
        return (
            <PageShell topbar={<Topbar title="Not Found" />}>
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400/60" />
                    <p className="text-white/60">Task not found</p>
                    <Link href={`/projects/${projectId}`} className="text-sm text-violet-400 hover:text-violet-300">← Back to Project</Link>
                </div>
            </PageShell>
        );
    }

    const isMyTask = task.assignedTo === task.currentUserId;
    const { project, status } = task;

    return (
        <PageShell
            topbar={
                <Topbar
                    title={
                        <div className="flex items-center gap-3">
                            <Link href={`/projects/${projectId}`} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                                <ArrowLeft size={15} /> {project.title}
                            </Link>
                            <span className="text-white/20">/</span>
                            <h1 className="text-lg font-bold line-clamp-1">{task.title || `Scene ${task.sceneNumber}`}</h1>
                        </div>
                    }
                />
            }
        >
            <div className="flex flex-col gap-6">
                {/* ── Approved ── */}
                {status === "approved" && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                        <GlassCard className="bg-emerald-500/10 border-emerald-500/30 flex flex-col items-center gap-3 py-10 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-400" />
                            <h2 className="text-xl font-bold text-emerald-300">Approved!</h2>
                            <p className="text-white/60 text-sm">Your video was approved. ₹{project.rewardPerTask} tokens have been credited to your wallet.</p>
                        </GlassCard>
                    </motion.div>
                )}

                {/* ── Rejected ── */}
                {status === "rejected" && (
                    <GlassCard className="bg-red-500/10 border-red-500/30 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-red-400 font-semibold"><AlertCircle size={18} /> Submission Rejected</div>
                        <p className="text-white/60 text-sm">Your submission didn&apos;t meet the required quality. Please review the prompt and try again on another open task.</p>
                    </GlassCard>
                )}

                {/* ── Pending review ── */}
                {status === "pending_review" && (
                    <GlassCard className="bg-cyan-500/10 border-cyan-500/30 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-semibold"><Loader2 size={18} className="animate-spin" /> Submitted — Awaiting Review</div>
                        <p className="text-white/60 text-sm">Your video is in the review queue. You&apos;ll be notified once it&apos;s reviewed.</p>
                    </GlassCard>
                )}

                {/* ── Task prompt card ── */}
                {(status === "open" || (status === "assigned" && isMyTask)) && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <GlassCard className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-white">{task.title || `Scene ${task.sceneNumber}`}</h2>
                                    <p className="text-xs text-white/40 mt-0.5">{project.resolution} · {project.aspectRatio} · {project.clipDurationS}s</p>
                                </div>
                                <span className="text-lg font-bold text-emerald-400 shrink-0">₹{project.rewardPerTask}</span>
                            </div>
                            <div className="relative bg-white/5 rounded-xl p-4 text-sm text-white/70 leading-relaxed font-mono">
                                {task.prompt}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-all"
                                >
                                    {copied ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                                    {copied ? "Copied!" : "Copy Prompt"}
                                </button>
                                {task.expiresAt && status === "assigned" && (
                                    <span className="text-xs text-amber-400/80">
                                        Expires {new Date(task.expiresAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* ── Claim button (open tasks) ── */}
                {status === "open" && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <GlassCard className="flex flex-col items-center gap-4 py-8 text-center">
                            <p className="text-white/60 text-sm">Claim this task to start working on it.</p>
                            <button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-60 flex items-center gap-2"
                            >
                                {claiming && <Loader2 size={16} className="animate-spin" />}
                                {claiming ? "Claiming…" : "Claim Task"}
                            </button>
                        </GlassCard>
                    </motion.div>
                )}

                {/* ── Assigned to someone else ── */}
                {status === "assigned" && !isMyTask && (
                    <GlassCard className="bg-amber-500/10 border-amber-500/30 text-center py-8">
                        <p className="text-amber-300 font-semibold">This task has been claimed by another user.</p>
                        <p className="text-white/50 text-sm mt-1">Check back later or pick another task from the project.</p>
                    </GlassCard>
                )}

                {/* ── Steps + Submit (assigned to me) ── */}
                {status === "assigned" && isMyTask && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-4">
                        {/* Steps */}
                        <GlassCard>
                            <h3 className="font-semibold text-white mb-4">How to complete this task</h3>
                            <ol className="flex flex-col gap-3">
                                {steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </GlassCard>

                        {/* Submit form */}
                        <GlassCard className="space-y-4">
                            <h3 className="font-semibold text-white">Submit Your Work</h3>

                            <div className="space-y-2">
                                <label className="text-xs text-white/50 font-medium">Google Drive Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={driveUrl}
                                        onChange={(e) => { setDriveUrl(e.target.value); setVerified(null); }}
                                        placeholder="https://drive.google.com/file/d/..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    />
                                    <button
                                        onClick={handleVerify}
                                        disabled={verifying || !driveUrl.trim()}
                                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {verifying ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                                        {verifying ? "Verifying…" : "Verify"}
                                    </button>
                                </div>
                            </div>

                            {/* Verified result */}
                            {verified && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                                    <div className="min-w-0 text-sm">
                                        <p className="text-emerald-300 font-medium truncate">{verified.name}</p>
                                        <p className="text-white/40 text-xs">{verified.mimeType} · {verified.sizeMb} MB</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!verified || submitting}
                                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {submitting ? "Submitting…" : "Submit for Review"}
                            </button>
                        </GlassCard>
                    </motion.div>
                )}
            </div>
        </PageShell>
    );
}
