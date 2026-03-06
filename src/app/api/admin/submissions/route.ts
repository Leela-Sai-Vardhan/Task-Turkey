import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSubmissions } from "@/lib/db/queries/tasks";
import { isAdmin } from "@/lib/auth/admin";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const submissions = await getAdminSubmissions();
    const normalized = submissions.map((s) => ({
        ...s,
        video: s.video?.driveUrl ? s.video : null,
    }));
    return NextResponse.json(normalized);
}

