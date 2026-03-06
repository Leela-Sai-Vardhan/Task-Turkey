import { db } from "@/lib/db";
import { tasks, projects, profiles, videoOutputs } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

/** Get a single task by ID with parent project info */
export async function getTask(taskId: string) {
    const rows = await db
        .select({
            id: tasks.id,
            projectId: tasks.projectId,
            sceneNumber: tasks.sceneNumber,
            title: tasks.title,
            prompt: tasks.prompt,
            status: tasks.status,
            assignedTo: tasks.assignedTo,
            assignedAt: tasks.assignedAt,
            expiresAt: tasks.expiresAt,
            submittedAt: tasks.submittedAt,
            reviewedAt: tasks.reviewedAt,
            createdAt: tasks.createdAt,
            project: {
                id: projects.id,
                title: projects.title,
                description: projects.description,
                styleGuide: projects.styleGuide,
                resolution: projects.resolution,
                aspectRatio: projects.aspectRatio,
                clipDurationS: projects.clipDurationS,
                suggestedModels: projects.suggestedModels,
                rewardPerTask: projects.rewardPerTask,
            },
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.id, taskId))
        .limit(1);
    return rows[0] ?? null;
}

/** Get pending_review tasks with submitter + video info (admin only) */
export async function getAdminSubmissions() {
    return db
        .select({
            id: tasks.id,
            projectId: tasks.projectId,
            sceneNumber: tasks.sceneNumber,
            title: tasks.title,
            submittedAt: tasks.submittedAt,
            assignedTo: tasks.assignedTo,
            project: { id: projects.id, title: projects.title, rewardPerTask: projects.rewardPerTask },
            submitter: { id: profiles.id, displayName: profiles.displayName, trustLevel: profiles.trustLevel },
            video: {
                id: videoOutputs.id,
                driveUrl: videoOutputs.driveUrl,
                fileName: videoOutputs.fileName,
                fileSizeMb: videoOutputs.fileSizeMb,
                mimeType: videoOutputs.mimeType,
            },
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .innerJoin(profiles, eq(tasks.assignedTo, profiles.id))
        .leftJoin(videoOutputs, eq(videoOutputs.taskId, tasks.id))
        .where(eq(tasks.status, "pending_review"))
        .orderBy(tasks.submittedAt);
}



const TASK_EXPIRY_HOURS = 24;

export async function listTasks(projectId: string) {
    return db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

export async function getMyTasks(userId: string) {
    return db.select().from(tasks).where(eq(tasks.assignedTo, userId));
}

export async function claimTask(taskId: string, userId: string) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TASK_EXPIRY_HOURS * 60 * 60 * 1000);

    // Atomic: only claim if task is open AND user has fewer than 3 active tasks
    const [updated] = await db
        .update(tasks)
        .set({
            status: "assigned",
            assignedTo: userId,
            assignedAt: now,
            expiresAt,
        })
        .where(
            and(
                eq(tasks.id, taskId),
                eq(tasks.status, "open"),
                sql`(SELECT count(*) FROM ${tasks} WHERE assigned_to = ${userId} AND status IN ('assigned', 'submitted')) < 3`
            )
        )
        .returning();

    if (!updated) {
        // Distinguish between task-gone and limit-reached
        const [existing] = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.id, taskId)).limit(1);
        if (!existing || existing.status !== "open") throw new Error("Task is no longer available.");
        throw new Error("You already have 3 active tasks. Complete one first.");
    }
    return updated;
}

export async function submitTask(taskId: string, userId: string) {
    const [updated] = await db
        .update(tasks)
        .set({ status: "pending_review", submittedAt: new Date() })
        .where(
            and(
                eq(tasks.id, taskId),
                eq(tasks.assignedTo, userId),
                eq(tasks.status, "assigned"), // guard: only assigned tasks can be submitted
            )
        )
        .returning();

    if (!updated) throw new Error("Task not found, not assigned to you, or already submitted.");
    return updated;
}

export async function reviewTask(
    taskId: string,
    reviewerId: string,
    decision: "approved" | "rejected"
) {
    const status = decision === "approved" ? "approved" : "rejected";
    const [updated] = await db
        .update(tasks)
        .set({ status, reviewedAt: new Date(), reviewedBy: reviewerId })
        .where(and(eq(tasks.id, taskId), eq(tasks.status, "pending_review"))) // guard: only pending_review tasks can be reviewed
        .returning();

    if (!updated) throw new Error("Task not found or not in pending_review state.");
    return updated;
}
