import { db } from "@/lib/db";
import { profiles, tasks, tokenTransactions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getProfile(userId: string) {
    const rows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
    return rows[0] ?? null;
}

export async function updateProfile(
    userId: string,
    data: Partial<{ displayName: string; bio: string; username: string }>
) {
    return db
        .update(profiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(profiles.id, userId));
}

export async function getLeaderboard(limit = 50) {
    return db
        .select({
            id: profiles.id,
            displayName: profiles.displayName,
            username: profiles.username,
            avatarUrl: profiles.avatarUrl,
            trustLevel: profiles.trustLevel,
            tokenBalance: profiles.tokenBalance,
            tasksCompleted: profiles.tasksCompleted,
            approvalRate: profiles.approvalRate,
        })
        .from(profiles)
        .where(sql`${profiles.tasksCompleted} > 0`)
        .orderBy(desc(profiles.tokenBalance))
        .limit(limit);
}
