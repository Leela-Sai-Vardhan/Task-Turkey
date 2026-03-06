"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import Link from "next/link";

const AI_MODELS = ["Kling AI", "Runway Gen-3", "Hailuo AI", "Wan 2.1", "Minimax", "Pika 2.0"];
const RESOLUTIONS = ["1080p", "720p", "4K", "1440p"];
const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "21:9"];
const PROJECT_TYPES = ["Video Pipeline", "Custom"];

interface Scene {
    id: number;
    title: string;
    prompt: string;
}

const EMPTY_SCENE = (): Scene => ({ id: Date.now(), title: "", prompt: "" });

export default function AdminCreateProjectPage() {
    const router = useRouter();
    // Form state
    const [title, setTitle] = useState("");
    const [description, setDesc] = useState("");
    const [projectType, setType] = useState(PROJECT_TYPES[0]);
    const [rewardPerTask, setReward] = useState("");
    const [deadline, setDeadline] = useState("");
    const [selectedModels, setModels] = useState<string[]>([]);
    const [styleGuide, setStyle] = useState("");
    const [resolution, setRes] = useState(RESOLUTIONS[0]);
    const [aspectRatio, setAspect] = useState(ASPECT_RATIOS[0]);
    const [clipDuration, setDuration] = useState("10");
    const [scenes, setScenes] = useState<Scene[]>([EMPTY_SCENE()]);
    const [previewOpen, setPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const toggleModel = (m: string) =>
        setModels((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

    const addScene = () => {
        setScenes((s) => [...s, EMPTY_SCENE()]);
        toast.success("Scene added", { icon: "➕" });
    };

    const removeScene = (id: number) => {
        if (scenes.length === 1) { toast.error("A project needs at least 1 scene."); return; }
        setScenes((s) => s.filter((sc) => sc.id !== id));
    };

    const updateScene = (id: number, field: keyof Omit<Scene, "id">, value: string) =>
        setScenes((s) => s.map((sc) => sc.id === id ? { ...sc, [field]: value } : sc));

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error("Project title is required."); return; }
        if (!rewardPerTask) { toast.error("Reward per task is required."); return; }
        if (scenes.some((s) => !s.prompt.trim())) { toast.error("All scenes need a prompt."); return; }

        setSubmitting(true);
        try {
            const r = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    styleGuide,
                    resolution,
                    aspectRatio,
                    clipDurationS: parseInt(clipDuration) || 10,
                    suggestedModels: selectedModels,
                    rewardPerTask: parseInt(rewardPerTask),
                    deadline: deadline || undefined,
                    scenes: scenes.map((s, i) => ({
                        sceneNumber: i + 1,
                        title: s.title || `Scene ${String(i + 1).padStart(2, "0")}`,
                        prompt: s.prompt,
                    })),
                }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Failed to create project");
            toast.success(`Project "${title}" created with ${scenes.length} scene${scenes.length > 1 ? "s" : ""}! 🚀`, { duration: 5000 });
            router.push(`/projects/${data.project.id}`);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to create project");
        } finally {
            setSubmitting(false);
        }
    };

    void projectType; // used as display value only

    return (
        <PageShell
            topbar={
                <Topbar
                    title={<h1 className="text-xl font-bold">Create New Project</h1>}
                    right={
                        <Link href="/admin/review">
                            <button className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/60 hover:bg-white/10 transition-colors">
                                ← Back to Review
                            </button>
                        </Link>
                    }
                />
            }
        >
            <div className="flex flex-col gap-5 max-w-4xl mx-auto">

                {/* ── Section 1: Project Details ── */}
                <GlassCard className="flex flex-col gap-5 p-6">
                    <h2 className="text-base font-semibold text-white/80 uppercase tracking-widest text-[11px]">Project Details</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Title */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-[13px] font-medium text-white/60">Project Title *</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. The Last Lighthouse — Season 2"
                                className="form-input"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-[13px] font-medium text-white/60">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={3}
                                placeholder="Describe the project — genre, mood, intended use..."
                                className="form-input resize-none"
                            />
                        </div>

                        {/* Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Project Type</label>
                            <div className="flex gap-2">
                                {PROJECT_TYPES.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex-1 rounded-xl border py-2.5 text-[13px] transition-colors ${projectType === t
                                            ? "border-violet-500/50 bg-violet-500/20 text-violet-300 font-semibold"
                                            : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reward */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Reward per Task (₹) *</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/40">₹</span>
                                <input
                                    type="number"
                                    value={rewardPerTask}
                                    onChange={(e) => setReward(e.target.value)}
                                    placeholder="50"
                                    className="form-input pl-8"
                                />
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        {/* Style Guide */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Style Guide</label>
                            <input
                                value={styleGuide}
                                onChange={(e) => setStyle(e.target.value)}
                                placeholder="e.g. Cinematic, moody, 24fps, muted palette..."
                                className="form-input"
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* ── Section 2: Technical Settings ── */}
                <GlassCard className="flex flex-col gap-5 p-6">
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Technical Settings</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Resolution */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Resolution</label>
                            <div className="flex flex-wrap gap-2">
                                {RESOLUTIONS.map((r) => (
                                    <button key={r} onClick={() => setRes(r)}
                                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${resolution === r ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 font-semibold" : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"
                                            }`}
                                    >{r}</button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.map((a) => (
                                    <button key={a} onClick={() => setAspect(a)}
                                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${aspectRatio === a ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 font-semibold" : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"
                                            }`}
                                    >{a}</button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-white/60">Clip Duration (seconds)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={clipDuration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    min={1} max={60}
                                    className="form-input pr-10"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/30">sec</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Models */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-medium text-white/60">Suggested AI Models</label>
                        <div className="flex flex-wrap gap-2">
                            {AI_MODELS.map((m) => (
                                <button key={m} onClick={() => toggleModel(m)}
                                    className={`rounded-full border px-4 py-1.5 text-[13px] transition-all ${selectedModels.includes(m)
                                        ? "border-violet-500/60 bg-violet-500/25 text-violet-300 font-semibold"
                                        : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"
                                        }`}
                                >
                                    {selectedModels.includes(m) && <span className="mr-1">✓</span>}
                                    {m}
                                </button>
                            ))}
                        </div>
                        {selectedModels.length > 0 && (
                            <p className="text-xs text-white/30">Selected: {selectedModels.join(", ")}</p>
                        )}
                    </div>
                </GlassCard>

                {/* ── Section 3: Scene Builder ── */}
                <GlassCard className="flex flex-col gap-4 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Scene / Task Builder</h2>
                            <p className="mt-0.5 text-xs text-white/30">{scenes.length} scene{scenes.length !== 1 ? "s" : ""} — each becomes one claimable task</p>
                        </div>
                        <button onClick={addScene} className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
                            <Plus size={15} /> Add Scene
                        </button>
                    </div>

                    <AnimatePresence>
                        {scenes.map((sc, i) => (
                            <motion.div
                                key={sc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-violet-400">Scene {String(i + 1).padStart(2, "0")}</span>
                                    <button
                                        onClick={() => removeScene(sc.id)}
                                        className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <input
                                    value={sc.title}
                                    onChange={(e) => updateScene(sc.id, "title", e.target.value)}
                                    placeholder={`Scene ${i + 1} title — e.g. "The Lighthouse Beam at Dusk"`}
                                    className="form-input text-sm"
                                />
                                <textarea
                                    value={sc.prompt}
                                    onChange={(e) => updateScene(sc.id, "prompt", e.target.value)}
                                    rows={3}
                                    placeholder="AI prompt for this scene — be specific about camera movement, mood, style, duration..."
                                    className="form-input resize-none text-sm"
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </GlassCard>

                {/* ── Section 4: Preview ── */}
                <GlassCard className="flex flex-col overflow-hidden">
                    <button
                        onClick={() => setPreview(!previewOpen)}
                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.03]"
                    >
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-white/40" />
                            <span className="text-sm font-semibold">Preview (how workers will see this project)</span>
                        </div>
                        {previewOpen ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    </button>

                    <AnimatePresence>
                        {previewOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-white/[0.06]"
                            >
                                <div className="flex flex-col gap-3 p-6">
                                    <div className="flex h-28 items-center justify-center rounded-xl bg-violet-900/30 text-4xl">
                                        🎬
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{title || "Untitled Project"}</p>
                                        <p className="mt-1 text-sm text-white/50">{description || "No description provided."}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <span className="text-emerald-400 font-semibold">₹{rewardPerTask || "—"} / task</span>
                                        <span className="text-white/40">{scenes.length} scenes</span>
                                        <span className="text-white/40">{resolution} · {aspectRatio} · {clipDuration}s</span>
                                    </div>
                                    {selectedModels.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedModels.map((m) => (
                                                <span key={m} className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-[12px] text-violet-300">{m}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>

                {/* ── Submit ── */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4">
                    <p className="text-sm text-white/50">
                        <strong className="text-white">{scenes.length} scene{scenes.length > 1 ? "s" : ""}</strong> will be published as claimable tasks
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn-primary rounded-xl px-8 py-3 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                    >
                        {submitting ? <Loader2 size={15} className="animate-spin" /> : "🚀"}
                        {submitting ? "Creating…" : "Create Project"}
                    </button>
                </div>

            </div>
        </PageShell>
    );
}
