import Link from "next/link";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a1a]">
            {/* Mesh blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="mesh-blob h-[500px] w-[500px] bg-violet-600 opacity-15" style={{ top: -150, left: -100 }} />
                <div className="mesh-blob h-[400px] w-[400px] bg-cyan-500 opacity-10" style={{ bottom: -100, right: -100 }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
                {/* 404 */}
                <div className="flex flex-col items-center gap-2">
                    <span
                        className="select-none text-[10rem] font-black leading-none bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent"
                        style={{ lineHeight: 1 }}
                    >
                        404
                    </span>
                    <div className="h-px w-48 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                </div>

                {/* Card */}
                <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-10 py-10 backdrop-blur-sm max-w-md w-full">
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl">🔍</span>
                        <h1 className="text-2xl font-extrabold">Page Not Found</h1>
                        <p className="text-[15px] leading-relaxed text-white/50">
                            This page doesn't exist or may have been moved. Let's get you back on track.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Link href="/dashboard">
                            <button className="btn-primary w-full rounded-xl py-3 text-sm">
                                Go to Dashboard →
                            </button>
                        </Link>
                        <Link href="/projects">
                            <button className="btn-outline w-full rounded-xl py-3 text-sm text-white">
                                Browse Projects
                            </button>
                        </Link>
                    </div>
                </div>

                <p className="text-xs text-white/25">🦃 Task Turkey</p>
            </div>
        </div>
    );
}
