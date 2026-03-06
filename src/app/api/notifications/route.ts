import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** GET /api/notifications — fetch user's notifications */
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(notifications.createdAt);

    return NextResponse.json(rows.reverse());
}

/** PATCH /api/notifications — mark a single notification as read */
export async function PATCH(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { id?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, user.id)));

    return NextResponse.json({ ok: true });
}
