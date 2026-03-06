"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink, ClipboardList } from "lucide-react";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";

type Submission = {
    id: string;
    title: string;
    sceneNumber: number;
    submittedAt: string | null;
    project: { id: string; title: string; rewardPerTask: number };
    submitter: { id: string; displayName: string; trustLevel: number };
    video: { id: string; driveUrl: string; fileName: string | null; fileSizeMb: string | null; mimeType: string | null } | null;
};

const AVATAR_COLORS = ["bg-violet-600", "bg-cyan-500", "bg-amber-500", "bg-emerald-500", "bg-pink-500"];

export default function AdminReviewPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
    const [done, setDone] = useState<Record<string, "approved" | "rejected">>({});
    const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
    const [confirmingReject, setConfirmingReject] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch("/api/admin/submissions")
            .then((r) => r.json())
            .then((data) => {
                setSubmissions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleDecision = async (id: string, decision: "approved" | "rejected", taskTitle: string) => {
        setReviewing((r) => ({ ...r, [id]: true }));
        try {
            const r = await fetch(`/api/tasks/${id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision, note: rejectNote[id] ?? "" }),
            });
            if (!r.ok) throw new Error("Review failed");
            setDone((d) => ({ ...d, [id]: decision }));
            if (decision === "approved") {
                toast.success(`Approved: ${taskTitle}`, { icon: "✅" });
            } else {
                toast.error(`Rejected: ${taskTitle}`, { icon: "❌" });
            }
        } catch {
            toast.error("Review action failed. Try again.");
        } finally {
            setReviewing((r) => ({ ...r, [id]: false }));
            setConfirmingReject((c) => ({ ...c, [id]: false }));
        }
    };

    const pending = submissions.filter((s) => !done[s.id]);
    const approvedCount = Object.values(done).filter((d) => d === "approved").length;
    const rejectedCount = Object.values(done).filter((d) => d === "rejected").length;

    return (
        <PageShell
            topbar={
                <Topbar
                    title={<h1 className="text-xl font-bold">Admin — Review Submissions</h1>}
                    right={<Badge variant="red">🛡 Admin View</Badge>}
                />
            }
        >
            <div className="flex flex-col gap-6">
                {/* Stats strip */}
                <div className="flex flex-wrap gap-4">
                    {[
                        { label: "Pending", value: pending.length, color: "text-amber-400" },
                        { label: "Approved", value: approvedCount, color: "text-emerald-400" },
                        { label: "Rejected", value: rejectedCount, color: "text-red-400" },
                    ].map((s) => (
                        <GlassCard key={s.label} className="flex items-center gap-3 px-5 py-3.5">
                            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                            <span className="text-sm text-white/50">{s.label}</span>
                        </GlassCard>
                    ))}
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="flex flex-col gap-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && pending.length === 0 && Object.keys(done).length === 0 && (
                    <EmptyState
                        icon={<ClipboardList className="w-10 h-10 text-white/20" />}
                        title="No pending submissions"
                        description="All caught up! Submissions will appear here when users submit their work."
                    />
                )}

                {/* Review table */}
                {!loading && submissions.length > 0 && (
                    <GlassCard className="overflow-hidden">
                        {/* Header */}
                        <div className="hidden grid-cols-[2fr_1.4fr_2fr_1fr] gap-4 border-b border-white/[0.06] px-5 py-3.5 md:grid">
                            {["TASK / PROJECT", "SUBMITTED BY", "DRIVE LINK / FILE", "ACTION"].map((h) => (
                                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-white/30">{h}</span>
                            ))}
                        </div>

                        <AnimatePresence>
                            {submissions.map((s, i) => {
                                const isDone = !!done[s.id];
                                const isReviewing = !!reviewing[s.id];
                                const isConfirmingReject = !!confirmingReject[s.id];
                                const initial = s.submitter.displayName?.[0]?.toUpperCase() ?? "?";
                                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];

                                return (
                                    <motion.div
                                        key={s.id}
                                        animate={{ opacity: isDone ? 0.45 : 1 }}
                                        exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                                        className="border-t border-white/[0.05] p-5"
                                    >
                                        <div className="flex flex-col gap-4 md:grid md:grid-cols-[2fr_1.4fr_2fr_1fr] md:items-start md:gap-4">
                                            {/* Task info */}
                                            <div>
                                                <p className="text-sm font-medium text-white/85">{s.title || `Scene ${s.sceneNumber}`}</p>
                                                <p className="mt-0.5 text-xs text-white/35">{s.project.title}</p>
                                                <p className="mt-0.5 text-xs text-emerald-400">₹{s.project.rewardPerTask}</p>
                                            </div>

                                            {/* Submitter */}
                                            <div className="flex items-center gap-2">
                                                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor}`}>
                                                    {initial}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white/70">{s.submitter.displayName}</p>
                                                    <p className="text-xs text-white/30">Lv {s.submitter.trustLevel}</p>
                                                </div>
                                            </div>

                                            {/* Drive link */}
                                            <div>
                                                {s.video ? (
                                                    <>
                                                        <a
                                                            href={s.video.driveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 truncate"
                                                        >
                                                            <ExternalLink size={11} />
                                                            {s.video.fileName ?? "View on Drive"}
                                                        </a>
                                                        <p className="mt-0.5 text-[11px] text-white/40">
                                                            {s.video.mimeType?.split("/")[1] ?? "file"} · {s.video.fileSizeMb ? `${s.video.fileSizeMb} MB` : ""}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-white/30">No video submitted</p>
                                                )}
                                                {s.submittedAt && (
                                                    <p className="mt-0.5 text-[11px] text-white/25">
                                                        {new Date(s.submittedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action */}
                                            <div className="flex flex-col gap-2">
                                                {isDone ? (
                                                    <span className={`text-sm font-semibold ${done[s.id] === "approved" ? "text-emerald-400" : "text-red-400"}`}>
                                                        {done[s.id] === "approved" ? "✓ Approved" : "✕ Rejected"}
                                                    </span>
                                                ) : isConfirmingReject ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={rejectNote[s.id] ?? ""}
                                                            onChange={(e) => setRejectNote((n) => ({ ...n, [s.id]: e.target.value }))}
                                                            placeholder="Reason (optional)…"
                                                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-full"
                                                        />
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleDecision(s.id, "rejected", s.title)}
                                                                disabled={isReviewing}
                                                                className="flex-1 rounded-lg border border-red-500/25 bg-red-500/15 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25 flex items-center justify-center gap-1 disabled:opacity-60"
                                                            >
                                                                {isReviewing && <Loader2 size={10} className="animate-spin" />}
                                                                Confirm Reject
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmingReject((c) => ({ ...c, [s.id]: false }))}
                                                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/10"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDecision(s.id, "approved", s.title)}
                                                            disabled={isReviewing}
                                                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 flex items-center gap-1 disabled:opacity-60"
                                                        >
                                                            {isReviewing && <Loader2 size={10} className="animate-spin" />}
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingReject((c) => ({ ...c, [s.id]: true }))}
                                                            disabled={isReviewing}
                                                            className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </GlassCard>
                )}
            </div>
        </PageShell>
    );
}
