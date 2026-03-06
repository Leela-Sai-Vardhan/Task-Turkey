import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Allow only same-origin relative paths; block open redirect to external sites */
function safeNext(next: string | null): string {
    if (!next) return "/dashboard";
    // Must be a relative path: starts with / and contains no scheme (no ://)
    if (next.startsWith("/") && !next.includes("://")) return next;
    return "/dashboard";
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = safeNext(searchParams.get("next"));

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Auth error — redirect to login with error message
    return NextResponse.redirect(`${origin}/login?error=auth`);
}
