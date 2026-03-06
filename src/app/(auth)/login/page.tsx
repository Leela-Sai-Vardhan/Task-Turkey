"use client";

import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Inner component that uses useSearchParams — must be inside <Suspense>
function LoginContent() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") ?? "/dashboard";

    const handleGoogleSignIn = async () => {
        const supabase = createClient();
        const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
        callbackUrl.searchParams.set("next", returnTo);
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl.toString(),
            },
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a1a] overflow-hidden">
            {/* Mesh blobs */}
            <div className="mesh-blob h-96 w-96 bg-violet-600 -top-20 -left-20" style={{ position: "absolute" }} />
            <div className="mesh-blob h-72 w-72 bg-cyan-500 bottom-10 right-10" style={{ position: "absolute" }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center backdrop-blur-sm"
            >
                {/* Logo */}
                <div className="mb-6 flex flex-col items-center gap-3">
                    <img src="/logo.png" alt="Task Turkey" className="h-16 w-16 object-contain" />
                    <div>
                        <h1 className="text-2xl font-extrabold">Task Turkey</h1>
                        <p className="mt-1 text-[13px] text-white/50">
                            Sign in to start earning tokens
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="mb-6 border-t border-white/[0.07]" />

                {/* Google button */}
                <button
                    onClick={handleGoogleSignIn}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.12] hover:border-white/25 active:scale-[0.98]"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <p className="mt-6 text-xs leading-relaxed text-white/30">
                    By signing in you agree to our Terms of Service.
                    <br />
                    No subscription required — earn by completing tasks.
                </p>
            </motion.div>
        </div>
    );
}

// Outer page wraps LoginContent in Suspense (required by Next.js for useSearchParams)
export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
