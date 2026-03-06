import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "amber" | "purple" | "red" | "cyan" | "gray";

interface BadgeProps {
    variant: BadgeVariant;
    className?: string;
    children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
    green: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
    amber: "bg-amber-400/15  border border-amber-400/30  text-amber-400",
    purple: "bg-violet-500/15 border border-violet-500/30 text-violet-300",
    red: "bg-red-500/15    border border-red-500/25    text-red-400",
    cyan: "bg-cyan-400/15   border border-cyan-400/25   text-cyan-300",
    gray: "bg-white/5       border border-white/10      text-white/40",
};

export default function Badge({ variant, className, children }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                variantClasses[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
