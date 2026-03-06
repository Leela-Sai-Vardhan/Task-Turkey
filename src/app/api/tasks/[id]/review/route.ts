import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, projects, profiles, videoOutputs, tokenTransactions } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { createNotification } from "@/lib/db/queries/notifications";
import { isAdmin } from "@/lib/auth/admin";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: taskId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !isAdmin(user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { decision?: string; note?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { decision, note } = body;
    if (decision !== "approved" && decision !== "rejected") {
        return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
    }

    try {
        // Fetch task + project before transaction
        const [taskRow] = await db
            .select({ assignedTo: tasks.assignedTo, projectId: tasks.projectId })
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!taskRow) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const [project] = await db
            .select({ rewardPerTask: projects.rewardPerTask, title: projects.title })
            .from(projects)
            .where(eq(projects.id, taskRow.projectId!))
            .limit(1);

        // A4: All DB writes in a single transaction
        const updated = await db.transaction(async (tx) => {
            // Update task (pending_review guard is in the WHERE clause)
            const [task] = await tx
                .update(tasks)
                .set({ status: decision as "approved" | "rejected", reviewedAt: new Date(), reviewedBy: user.id })
                .where(and(eq(tasks.id, taskId), eq(tasks.status, "pending_review")))
                .returning();

            if (!task) throw new Error("Task not found or not in pending_review state.");

            // Update video output
            await tx
                .update(videoOutputs)
                .set({ status: decision as "approved" | "rejected", reviewerNote: note, reviewedAt: new Date() })
                .where(eq(videoOutputs.taskId, taskId));

            if (decision === "approved" && taskRow.assignedTo) {
                const reward = project?.rewardPerTask ?? 50;

                await tx.insert(tokenTransactions).values({
                    userId: taskRow.assignedTo,
                    amount: reward,
                    type: "task_reward",
                    referenceId: taskId,
                    note: `Approved: ${project?.title ?? "task"}`,
                });

                await tx
                    .update(profiles)
                    .set({
                        tokenBalance: sql`${profiles.tokenBalance} + ${reward}`,
                        tasksCompleted: sql`${profiles.tasksCompleted} + 1`,
                        updatedAt: new Date(),
                    })
                    .where(eq(profiles.id, taskRow.assignedTo));
            }

            // Recompute approval_rate
            if (taskRow.assignedTo) {
                const [stats] = await tx
                    .select({
                        approved: sql<number>`count(*) filter (where status = 'approved')`,
                        rejected: sql<number>`count(*) filter (where status = 'rejected')`,
                    })
                    .from(tasks)
                    .where(eq(tasks.assignedTo, taskRow.assignedTo));

                const approved = Number(stats?.approved ?? 0);
                const rejected = Number(stats?.rejected ?? 0);
                const total = approved + rejected;
                if (total > 0) {
                    const rate = Math.round((approved / total) * 100);
                    await tx
                        .update(profiles)
                        .set({ approvalRate: sql`${rate}`, updatedAt: new Date() })
                        .where(eq(profiles.id, taskRow.assignedTo));
                }
            }

            return task;
        });

        // Notifications are fire-and-forget (non-critical side effect)
        if (taskRow.assignedTo) {
            const reward = project?.rewardPerTask ?? 50;
            await createNotification({
                userId: taskRow.assignedTo,
                title: decision === "approved" ? "Task Approved! 🎉" : "Submission Rejected",
                body: decision === "approved"
                    ? `You earned ${reward} tokens for your submission.`
                    : (note ?? "Your submission did not meet the quality requirements. Please try again."),
                link: "/tasks",
            });
        }

        return NextResponse.json({ task: updated });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
