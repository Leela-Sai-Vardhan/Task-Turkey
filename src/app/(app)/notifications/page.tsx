"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Topbar from "@/components/Topbar";
import GlassCard from "@/components/GlassCard";
import EmptyState from "@/components/EmptyState";

type Notification = {
    id: string;
    title: string;
    body: string;
    link: string | null;
    read: boolean;
    createdAt: string;
};

export default function NotificationsPage() {
    const [notes, setNotes] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch_ = () =>
        fetch("/api/notifications")
            .then((r) => r.json())
            .then((data) => { setNotes(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));

    useEffect(() => { fetch_(); }, []);

    const markRead = async (id: string) => {
        setNotes((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
    };

    // C9: Single bulk request instead of N individual PATCHes
    const markAllRead = async () => {
        setNotes((n) => n.map((x) => ({ ...x, read: true })));
        await fetch("/api/notifications/read-all", { method: "PATCH" });
    };

    const unreadCount = notes.filter((n) => !n.read).length;

    return (
        <PageShell
            topbar={
                <Topbar
                    title={
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    }
                    right={
                        unreadCount > 0 ? (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                            >
                                <CheckCheck size={14} /> Mark all read
                            </button>
                        ) : undefined
                    }
                />
            }
        >
            {loading && (
                <div className="flex items-center justify-center py-20 text-white/30">
                    <Loader2 className="animate-spin w-6 h-6" />
                </div>
            )}

            {!loading && notes.length === 0 && (
                <EmptyState
                    icon={<Bell className="w-10 h-10 text-white/20" />}
                    title="No notifications yet"
                    description="You'll see task approvals, rejections and announcements here."
                />
            )}

            {!loading && notes.length > 0 && (
                <div className="flex flex-col gap-2 max-w-2xl">
                    <AnimatePresence>
                        {notes.map((n, i) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <GlassCard
                                    className={`flex items-start gap-4 transition-all ${n.read ? "opacity-50" : ""}`}
                                >
                                    {/* Unread dot */}
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-violet-400"}`} />

                                    <div className="flex-1 min-w-0">
                                        {/* C8: Clickable when notification has a link */}
                                        {n.link ? (
                                            <Link href={n.link} className="block hover:text-violet-300 transition-colors">
                                                <p className={`text-sm font-semibold ${n.read ? "text-white/50" : "text-white"}`}>{n.title}</p>
                                                <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{n.body}</p>
                                            </Link>
                                        ) : (
                                            <>
                                                <p className={`text-sm font-semibold ${n.read ? "text-white/50" : "text-white"}`}>{n.title}</p>
                                                <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{n.body}</p>
                                            </>
                                        )}
                                        <p className="text-[11px] text-white/25 mt-1.5">
                                            {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>

                                    {!n.read && (
                                        <button
                                            onClick={() => markRead(n.id)}
                                            title="Mark as read"
                                            className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </PageShell>
    );
}
