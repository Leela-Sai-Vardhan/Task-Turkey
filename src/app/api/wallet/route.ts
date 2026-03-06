import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance, getTransactions } from "@/lib/db/queries/tokens";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [balance, transactions] = await Promise.all([
        getBalance(user.id),
        getTransactions(user.id, 30),
    ]);

    return NextResponse.json({ balance, transactions });
}
