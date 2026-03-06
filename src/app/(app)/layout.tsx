import Sidebar from "@/components/Sidebar";
import { UserProvider } from "@/components/UserProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <div className="flex min-h-screen bg-[#0a0a1a]">
                <Sidebar />
                <main className="flex flex-1 flex-col min-w-0 bg-[#0d0d21]">
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}
