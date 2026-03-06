import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, videoOutputs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyDriveLink } from "@/lib/drive/verify";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: taskId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { driveUrl?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { driveUrl } = body;
    if (!driveUrl) {
        return NextResponse.json({ error: "driveUrl is required" }, { status: 400 });
    }

    const verification = await verifyDriveLink(driveUrl);
    if (!verification.valid) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    try {
        // A5: Wrap insert + task status update in a single transaction
        const task = await db.transaction(async (tx) => {
            await tx.insert(videoOutputs).values({
                taskId,
                userId: user.id,
                driveUrl,
                driveFileId: verification.fileId,
                fileName: verification.fileName,
                fileSizeMb: verification.fileSizeMb?.toString(),
                mimeType: verification.mimeType,
            });

            const [updated] = await tx
                .update(tasks)
                .set({ status: "pending_review", submittedAt: new Date() })
                .where(and(
                    eq(tasks.id, taskId),
                    eq(tasks.assignedTo, user.id),
                    eq(tasks.status, "assigned")
                ))
                .returning();

            if (!updated) throw new Error("Task not found, not assigned to you, or already submitted.");
            return updated;
        });

        return NextResponse.json({ task, verification });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
