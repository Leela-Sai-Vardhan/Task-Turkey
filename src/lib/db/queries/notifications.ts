import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getNotifications(userId: string, limit = 20) {
    return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
}

export async function markRead(notificationId: string, userId: string) {
    return db
        .update(notifications)
        .set({ read: true })
        .where(
            and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
        );
}

export async function createNotification(data: {
    userId: string;
    title: string;
    body: string;
    link?: string;
}) {
    return db.insert(notifications).values(data).returning();
}
