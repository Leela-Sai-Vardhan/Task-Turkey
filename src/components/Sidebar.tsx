"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, FolderOpen, ClipboardList, Wallet, Trophy,
    User, LogOut, Shield, ClipboardCheck, PlusSquare, Bell,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/tasks", label: "My Tasks", icon: ClipboardList },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
];

const adminItems = [
    { href: "/admin/review", label: "Review Queue", icon: ClipboardCheck },
    { href: "/admin/projects/new", label: "New Project", icon: PlusSquare },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, signOut } = useUser();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    const adminIds = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "")
        .split(",").map((s) => s.trim()).filter(Boolean);
    const isAdmin = !!user && adminIds.includes(user.id);

    const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? "User";
    const email = user?.email ?? "";
    const initial = displayName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="hidden md:flex h-screen w-[280px] flex-shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0a1a]/95 sticky top-0">
                {/* Logo */}
                <div className="flex h-[72px] items-center border-b border-white/[0.06] px-7">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-base">
                            ⚡
                        </div>
                        <span className="text-[17px] font-extrabold text-white">Task Turkey</span>
                    </div>
                </div>

                {/* Main nav */}
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pt-4">
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`sidebar-item ${isActive(href) ? "active" : ""}`}
                        >
                            <Icon size={18} strokeWidth={1.8} />
                            <span>{label}</span>
                        </Link>
                    ))}

                    {/* Admin section */}
                    {isAdmin && (
                        <div className="mt-4 flex flex-col gap-1">
                            <div className="flex items-center gap-2 px-4 py-2">
                                <Shield size={12} className="text-white/25" />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
                                    Admin
                                </span>
                            </div>
                            {adminItems.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`sidebar-item ${isActive(href) ? "active" : ""}`}
                                >
                                    <Icon size={18} strokeWidth={1.8} />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                {/* User footer */}
                <div className="border-t border-white/[0.06] px-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-bold text-white">
                            {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                            <p className="truncate text-xs text-white/40">{email}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            title="Sign out"
                            className="flex-shrink-0 rounded-lg p-1.5 text-white/30 hover:bg-white/[0.07] hover:text-white/70 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Mobile bottom nav ── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/[0.08] bg-[#0a0a1a]/95 backdrop-blur-sm md:hidden">
                {[
                    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
                    { href: "/projects", label: "Projects", icon: FolderOpen },
                    { href: "/tasks", label: "Tasks", icon: ClipboardList },
                    { href: "/notifications", label: "Alerts", icon: Bell },
                    { href: "/profile", label: "Profile", icon: User },
                ].map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${isActive(href) ? "text-violet-400" : "text-white/40 hover:text-white/70"
                            }`}
                    >
                        <Icon size={20} strokeWidth={1.6} />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
