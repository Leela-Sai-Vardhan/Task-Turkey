"use client";

import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import { motion } from "framer-motion";

interface StatCardProps {
    label: string;
    value: string;
    sub: string;
    valueColor?: string; // Tailwind text-* class e.g. "text-cyan-400"
    delay?: number;
}

export default function StatCard({
    label,
    value,
    sub,
    valueColor = "text-white",
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <GlassCard className="p-5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-white/45 tracking-wide uppercase">
                    {label}
                </span>
                <span className={cn("text-4xl font-bold leading-none", valueColor)}>
                    {value}
                </span>
                <span className="text-[13px] text-emerald-400">{sub}</span>
            </GlassCard>
        </motion.div>
    );
}
