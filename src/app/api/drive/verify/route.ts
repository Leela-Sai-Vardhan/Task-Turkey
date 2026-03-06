import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyDriveLink } from "@/lib/drive/verify";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { url?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.url) {
        return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await verifyDriveLink(body.url);
    return NextResponse.json(result);
}
