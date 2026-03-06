import { cn } from "@/lib/utils";

interface PageShellProps {
    topbar?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

/** Wraps every app page: topbar (sticky) + scrollable body */
export default function PageShell({ topbar, children, className }: PageShellProps) {
    return (
        <div className="flex h-screen flex-col">
            {topbar}
            <div className={cn("flex-1 overflow-y-auto p-8", className)}>
                {children}
            </div>
        </div>
    );
}
