"use client";

import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";

interface TopbarProps {
    title?: React.ReactNode;
    right?: React.ReactNode;
    className?: string;
    showUserAvatar?: boolean;
}

export default function Topbar({
    title,
    right,
    className,
    showUserAvatar = false,
}: TopbarProps) {
    const { user, profile } = useUser();

    const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? "User";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header
            className={cn(
                "flex h-[72px] flex-shrink-0 items-center justify-between border-b border-white/[0.07] bg-[rgba(13,13,33,0.9)] px-8 backdrop-blur-sm",
                className,
            )}
        >
            <div className="flex flex-col justify-center">{title}</div>
            <div className="flex items-center gap-4">
                {right}
                {showUserAvatar && (
                    <>
                        <Link
                            href="/notifications"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] transition hover:bg-white/10"
                            aria-label="Notifications"
                        >
                            <Bell size={16} className="text-white/70" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-bold text-white">
                                {initial}
                            </div>
                            <span className="text-sm text-white/80">{displayName}</span>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
