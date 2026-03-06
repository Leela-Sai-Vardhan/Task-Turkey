"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserContextValue {
    user: User | null;
    profile: {
        id: string;
        display_name: string;
        username: string;
        avatar_url: string | null;
        trust_level: number;
        token_balance: number;
        tasks_completed: number;
        bio: string | null;
        approval_rate: number;
    } | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserContextValue["profile"]>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchProfile = async (userId: string) => {
            const { data } = await supabase
                .from("profiles")
                .select("id, display_name, username, avatar_url, trust_level, token_balance, tasks_completed, bio, approval_rate")
                .eq("id", userId)
                .single();
            setProfile(data);
        };

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) fetchProfile(user.id).finally(() => setLoading(false));
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
    };

    return (
        <UserContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
