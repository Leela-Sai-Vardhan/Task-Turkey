import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, profiles, tokenTransactions } from "@/lib/db/schema";
import { eq, sql, gt } from "drizzle-orm";

export const revalidate = 3600; // revalidate once per hour

export async function GET() {
    const [taskRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(eq(tasks.status, "approved"));

    const [memberRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(profiles);

    // Sum all positive token_transactions (real credits to users)
    const [tokenRow] = await db
        .select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(tokenTransactions)
        .where(gt(tokenTransactions.amount, 0));

    return NextResponse.json({
        tasksCompleted: Number(taskRow?.count ?? 0),
        members: Number(memberRow?.count ?? 0),
        tokensAwarded: Number(tokenRow?.total ?? 0),
    });
}
