/** Server-side admin check. Uses ADMIN_USER_IDS env var (not the NEXT_PUBLIC_ variant). */
export function isAdmin(userId: string): boolean {
    const adminIds = (process.env.ADMIN_USER_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return adminIds.includes(userId);
}
