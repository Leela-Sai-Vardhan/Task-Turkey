import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, tasks } from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

function periodStart(period: string): Date | null {
    const now = new Date();
    if (period === "week") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
    }
    if (period === "month") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        return d;
    }
    return null; // "all"
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "all";
    const since = periodStart(period);

    if (since) {
        // For time-filtered periods: aggregate from tasks table
        const rows = await db
            .select({
                id: profiles.id,
                displayName: profiles.displayName,
                username: profiles.username,
                trustLevel: profiles.trustLevel,
                tokenBalance: profiles.tokenBalance,
                tasksCompleted: sql<number>`count(${tasks.id})`,
                approvalRate: profiles.approvalRate,
            })
            .from(tasks)
            .innerJoin(profiles, eq(tasks.assignedTo, profiles.id))
            .where(and(
                eq(tasks.status, "approved"),
                gte(tasks.reviewedAt, since),
            ))
            .groupBy(profiles.id)
            .orderBy(desc(sql`count(${tasks.id})`))
            .limit(50);

        return NextResponse.json({ leaderboard: rows });
    }

    // All-time: use pre-computed columns (fast)
    const rows = await db
        .select({
            id: profiles.id,
            displayName: profiles.displayName,
            username: profiles.username,
            trustLevel: profiles.trustLevel,
            tokenBalance: profiles.tokenBalance,
            tasksCompleted: profiles.tasksCompleted,
            approvalRate: profiles.approvalRate,
        })
        .from(profiles)
        .where(sql`${profiles.tasksCompleted} > 0`)
        .orderBy(desc(profiles.tokenBalance))
        .limit(50);

    return NextResponse.json({ leaderboard: rows });
}
