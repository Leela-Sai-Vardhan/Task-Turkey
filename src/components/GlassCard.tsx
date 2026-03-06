import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "purple" | "cyan";

interface GlassCardProps {
    variant?: GlassCardVariant;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

const variantClasses: Record<GlassCardVariant, string> = {
    default: "bg-white/[0.04] border border-white/[0.08]",
    purple: "bg-purple-600/[0.08] border border-purple-500/25",
    cyan: "bg-cyan-400/[0.06] border border-cyan-400/20",
};

export default function GlassCard({
    variant = "default",
    className,
    children,
    onClick,
}: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-2xl backdrop-blur-sm",
                variantClasses[variant],
                onClick && "cursor-pointer transition-colors hover:bg-white/[0.06]",
                className,
            )}
        >
            {children}
        </div>
    );
}
