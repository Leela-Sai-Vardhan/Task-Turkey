"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, FolderOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";

type Project = {
    id: string;
    title: string;
    description: string | null;
    resolution: string;
    aspectRatio: string;
    clipDurationS: number;
    suggestedModels: string[] | null;
    rewardPerTask: number;
    totalTasks: number;
    openTasks: number;
};

const GRADIENTS = [
    { from: "from-violet-900/40", to: "to-violet-800/20" },
    { from: "from-cyan-900/40", to: "to-cyan-800/20" },
    { from: "from-amber-900/40", to: "to-amber-800/20" },
    { from: "from-emerald-900/40", to: "to-emerald-800/20" },
    { from: "from-pink-900/40", to: "to-pink-800/20" },
    { from: "from-yellow-900/40", to: "to-yellow-800/20" },
];

const filters = ["All", "Active", "Hiring"];

export default function ProjectsPage() {
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/projects")
            .then((r) => r.json())
            .then((data: Project[]) => {
                setProjects(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = projects.filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            activeFilter === "All" ||
            (activeFilter === "Active" && p.openTasks > 0) ||
            // Hiring: project is brand-new, all task slots still open
            (activeFilter === "Hiring" && p.openTasks > 0 && p.openTasks === p.totalTasks);
        return matchSearch && matchFilter;
    });

    return (
        <PageShell>
            <Topbar title="Projects" />
            <div className="p-6 space-y-6">
                {/* Search + Filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search projects…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === f
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                                    : "bg-white/5 text-white/60 hover:bg-white/10"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Project cards */}
                {!loading && filtered.length === 0 && (
                    <EmptyState
                        icon={<FolderOpen className="w-10 h-10 text-white/20" />}
                        title="No projects found"
                        description={search ? "Try a different search term" : "No active projects right now — check back soon"}
                    />
                )}

                {!loading && filtered.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((project, i) => {
                            const g = GRADIENTS[i % GRADIENTS.length];
                            const models = project.suggestedModels?.slice(0, 2) ?? [];
                            const meta = [
                                project.resolution,
                                `${project.totalTasks} scenes`,
                                models.join("/") || "AI Video",
                            ].join(" · ");

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link href={`/projects/${project.id}`}>
                                        <GlassCard className={`bg-gradient-to-br ${g.from} ${g.to} h-full hover:scale-[1.02] transition-transform cursor-pointer`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-2xl">🎬</span>
                                                {project.openTasks > 0 && (
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                                                        {project.openTasks} open
                                                    </span>
                                                )}
                                                {project.openTasks === 0 && (
                                                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/40 text-xs font-medium border border-white/10">
                                                        Full
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-white mb-1 line-clamp-1">{project.title}</h3>
                                            <p className="text-white/50 text-xs mb-4 line-clamp-1">{meta}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/60 text-sm">Per clip</span>
                                                <span className="text-white font-bold">₹{project.rewardPerTask}</span>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageShell>
    );
}
