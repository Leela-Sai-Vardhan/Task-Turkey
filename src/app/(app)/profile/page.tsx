"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Badge from "@/components/Badge";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/lib/supabase/client";

const trustLevels = [
    { level: 1, name: "Member", desc: "25 tasks → Verified", color: "text-amber-400", bar: "bg-amber-400" },
    { level: 2, name: "Verified", desc: "50 tasks → Trusted", color: "text-violet-400", bar: "bg-violet-500" },
    { level: 3, name: "Trusted", desc: "100 tasks → Senior", color: "text-cyan-400", bar: "bg-cyan-400" },
    { level: 4, name: "Senior", desc: "200 tasks → Elite", color: "text-emerald-400", bar: "bg-emerald-400" },
    { level: 5, name: "Elite", desc: "Max trust level", color: "text-yellow-400", bar: "bg-yellow-400" },
];

const milestones = [1, 25, 50, 100, 200];

function statusVariant(status: string): "green" | "amber" | "purple" | "cyan" | "red" {
    if (status === "approved") return "green";
    if (status === "pending_review") return "amber";
    if (status === "assigned") return "purple";
    if (status === "rejected") return "red";
    return "cyan";
}

type RecentTask = {
    id: string;
    title: string;
    status: string;
    project_id: string;
    projects: { title: string; reward_per_task: number } | null;
};

export default function ProfilePage() {
    const { user, profile } = useUser();
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState("");
    const [saving, setSaving] = useState(false);
    const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

    useEffect(() => {
        if (profile) setBio(profile.bio ?? "");
    }, [profile]);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();
        supabase
            .from("tasks")
            .select("id, title, status, project_id, projects(title, reward_per_task)")
            .eq("assigned_to", user.id)
            .in("status", ["approved", "pending_review", "rejected"])
            .order("reviewed_at", { ascending: false })
            .limit(5)
            .then(({ data }) => setRecentTasks((data as unknown as RecentTask[]) ?? []));
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("profiles")
            .update({ bio, updated_at: new Date().toISOString() })
            .eq("id", user.id);
        setSaving(false);
        if (error) {
            toast.error("Failed to save profile");
        } else {
            toast.success("Profile saved!");
            setEditing(false);
        }
    };

    const tasksCompleted = profile?.tasks_completed ?? 0;
    const trustLevel = profile?.trust_level ?? 1;
    const currentTrust = trustLevels.find(t => t.level === trustLevel) ?? trustLevels[0];
    const nextMilestone = milestones.find(m => m > tasksCompleted) ?? milestones[milestones.length - 1];
    const prevMilestone = milestones[milestones.indexOf(nextMilestone) - 1] ?? 0;
    const progressPct = Math.min(((tasksCompleted - prevMilestone) / (nextMilestone - prevMilestone)) * 100, 100);

    const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? "User";
    const email = user?.email ?? "";
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString([], { month: "long", year: "numeric" })
        : "—";

    return (
        <PageShell
            topbar={
                <Topbar
                    title={<h1 className="text-xl font-bold">Profile</h1>}
                    right={
                        <button
                            onClick={editing ? handleSave : () => setEditing(true)}
                            disabled={saving}
                            className={`rounded-xl px-5 py-2.5 text-sm transition-colors ${editing
                                ? "bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:opacity-60"
                                : "border border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
                                }`}
                        >
                            {saving ? "Saving…" : editing ? "✓ Save Profile" : "Edit Profile"}
                        </button>
                    }
                />
            }
        >
            <div className="flex flex-col gap-5">
                {/* ── Profile Header ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard variant="purple" className="flex flex-col gap-5 p-7 sm:flex-row sm:items-start sm:gap-7">
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 text-4xl font-black text-white shadow-lg shadow-violet-900/40">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl font-extrabold">{displayName}</h2>
                                <Badge variant={trustLevel >= 4 ? "green" : trustLevel >= 3 ? "cyan" : trustLevel >= 2 ? "purple" : "amber"}>
                                    Lv{trustLevel} · {currentTrust.name}
                                </Badge>
                            </div>
                            <p className="text-sm text-white/50">@{profile?.username ?? "—"} · {email}</p>
                            {editing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-violet-500/40 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-500/60"
                                    placeholder="Write a short bio…"
                                />
                            ) : (
                                <p className="text-sm leading-relaxed text-white/65 max-w-xl">
                                    {bio || <span className="italic text-white/30">No bio yet — click Edit Profile to add one.</span>}
                                </p>
                            )}
                            <p className="text-xs text-white/35">📅 Member since {memberSince}</p>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Tasks Completed" value={String(tasksCompleted)} sub="All time" valueColor="text-white" delay={0} />
                    <StatCard label="Token Balance" value={(profile?.token_balance ?? 0).toLocaleString()} sub="Current balance" valueColor="text-cyan-400" delay={0.07} />
                    <StatCard label="Approval Rate" value={`${Number(profile?.approval_rate ?? 0).toFixed(0)}%`} sub="Submitted tasks" valueColor="text-emerald-400" delay={0.14} />
                    <StatCard label="Trust Level" value={`Lv ${trustLevel}`} sub={currentTrust.name} valueColor="text-violet-300" delay={0.21} />
                </div>

                {/* ── Trust Level Progress ── */}
                <GlassCard className="flex flex-col gap-5 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h3 className="text-base font-semibold">Trust Level</h3>
                            <p className="mt-0.5 text-sm text-white/50">
                                {trustLevel < 5
                                    ? <>Complete <strong className="text-white">{nextMilestone - tasksCompleted} more tasks</strong> to reach the next level</>
                                    : "You've reached the maximum trust level! 🏆"}
                            </p>
                        </div>
                        <Badge variant={trustLevel >= 4 ? "green" : trustLevel >= 3 ? "cyan" : trustLevel >= 2 ? "purple" : "amber"}>
                            Lv{trustLevel} · {currentTrust.name}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-white/40">
                            <span>{tasksCompleted} tasks</span>
                            <span>{nextMilestone} tasks needed</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {trustLevels.map((lv) => (
                            <div
                                key={lv.level}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${lv.level === trustLevel
                                    ? "border-violet-500/50 bg-violet-500/15"
                                    : lv.level < trustLevel
                                        ? "border-white/10 bg-white/[0.04]"
                                        : "border-white/[0.05] bg-transparent opacity-40"
                                    }`}
                            >
                                <span className={`text-xl font-black ${lv.color}`}>{lv.level}</span>
                                <span className={`text-[11px] font-semibold ${lv.level === trustLevel ? "text-violet-300" : "text-white/50"}`}>{lv.name}</span>
                                {lv.level === trustLevel && <span className="text-[9px] text-violet-400">← You</span>}
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* ── Recent Activity ── */}
                <GlassCard className="flex flex-col">
                    <div className="border-b border-white/[0.06] px-5 py-4">
                        <h3 className="text-base font-semibold">Recent Activity</h3>
                    </div>
                    {recentTasks.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-white/40">No completed tasks yet.</p>
                    ) : (
                        recentTasks.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3.5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-white/85">{t.title || `Task ${t.id.slice(0, 6)}`}</p>
                                    <p className="mt-0.5 text-xs text-white/35">{t.projects?.title ?? "—"}</p>
                                </div>
                                <div className="ml-4 flex items-center gap-4 flex-shrink-0">
                                    {t.projects?.reward_per_task && (
                                        <span className="text-sm font-semibold text-emerald-400">+{t.projects.reward_per_task} 🪙</span>
                                    )}
                                    <Badge variant={statusVariant(t.status)}>
                                        {t.status === "pending_review" ? "In Review" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                    </Badge>
                                </div>
                            </motion.div>
                        ))
                    )}
                </GlassCard>

                {/* ── Account ── */}
                <GlassCard className="flex flex-col gap-4 p-6">
                    <h3 className="text-base font-semibold">Account</h3>
                    {[
                        { label: "Email", value: email, icon: "✉️" },
                        { label: "Linked Account", value: "Google", icon: "🔗" },
                        { label: "Account Status", value: "Active", icon: "✅" },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between border-b border-white/[0.05] pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="text-base">{row.icon}</span>
                                <span className="text-sm text-white/50">{row.label}</span>
                            </div>
                            <span className="text-sm font-medium text-white/80">{row.value}</span>
                        </div>
                    ))}
                </GlassCard>
            </div>
        </PageShell>
    );
}
