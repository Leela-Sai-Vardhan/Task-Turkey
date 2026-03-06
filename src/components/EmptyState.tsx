import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-8 py-16 text-center",
                className,
            )}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-white/30">
                {icon}
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white/80">{title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-white/40">{description}</p>
            </div>
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <button className="btn-primary mt-2 rounded-xl px-6 py-2.5 text-sm">
                        {actionLabel}
                    </button>
                </Link>
            )}
        </div>
    );
}
