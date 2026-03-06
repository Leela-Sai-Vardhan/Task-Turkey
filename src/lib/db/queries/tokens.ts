import { db } from "@/lib/db";
import { tokenTransactions, profiles } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { tokenTxTypeEnum } from "@/lib/db/schema";

type TxType = typeof tokenTxTypeEnum.enumValues[number];

/**
 * Credits tokens to a user atomically:
 * - inserts a transaction record
 * - increments token_balance on the profile
 */
export async function creditTokens(
    userId: string,
    amount: number,
    type: TxType,
    referenceId?: string,
    note?: string
) {
    return db.transaction(async (tx) => {
        await tx.insert(tokenTransactions).values({
            userId,
            amount,
            type,
            referenceId,
            note,
        });
        await tx
            .update(profiles)
            .set({
                tokenBalance: sql`${profiles.tokenBalance} + ${amount}`,
                updatedAt: new Date(),
            })
            .where(eq(profiles.id, userId));
    });
}

export async function getBalance(userId: string): Promise<number> {
    const rows = await db
        .select({ balance: profiles.tokenBalance })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
    return rows[0]?.balance ?? 0;
}

export async function getTransactions(userId: string, limit = 30) {
    return db
        .select()
        .from(tokenTransactions)
        .where(eq(tokenTransactions.userId, userId))
        .orderBy(desc(tokenTransactions.createdAt))
        .limit(limit);
}
