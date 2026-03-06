import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Updates the Supabase session on every request.
 * Call this from middleware.ts.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protected app routes
    const protectedPaths = [
        "/dashboard", "/projects", "/tasks", "/wallet",
        "/leaderboard", "/profile", "/notifications",
    ];
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        // D1: Preserve the intended destination so the login page can restore it after auth
        url.searchParams.set("returnTo", pathname);
        return NextResponse.redirect(url);
    }

    // Admin-only routes
    if (pathname.startsWith("/admin")) {
        const adminIds = (process.env.ADMIN_USER_IDS ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        if (!user || !adminIds.includes(user.id)) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    // Redirect logged-in users away from /login
    if (user && pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

/**
 * Service-role admin client — bypasses RLS.
 * Only use on the server side.
 */
export function adminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
