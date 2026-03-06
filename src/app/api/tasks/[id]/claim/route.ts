import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimTask } from "@/lib/db/queries/tasks";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: taskId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const task = await claimTask(taskId, user.id);
        return NextResponse.json({ task });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to claim task";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
