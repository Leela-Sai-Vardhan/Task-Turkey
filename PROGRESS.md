# TaskForge — Progress Snapshot

> Last updated: 2026-03-02
> Status: **MVP functionally complete. All pages wired to real Supabase data.**
> Next step: **Polish + Deploy**

---

## Quick Resume Prompt

When starting a new session, say:

> "Read `PROGRESS.md` and `plan.md` at `D:\TaskForge` and `D:\TaskForge\task-forge` and continue building TaskForge."

---

## What This Project Is

TaskForge is a crowdsourced micro-task platform where users contribute their free-tier AI tool usage (Kling, Runway, Hailuo, Wan 2.1) to collectively produce monetizable YouTube videos. Users claim tasks, copy prompts, generate video clips externally, paste Google Drive links (no file uploads — zero storage cost), get reviewed, and earn tokens.

Key concept: Users store videos on their own Google Drive (15GB free). TaskForge stores only the URL string. This eliminates storage costs entirely.

---

## Current State — What's Built

### Authentication (COMPLETE)
- Google OAuth via Supabase Auth — full end-to-end flow
- Login page at `/login` with glassmorphism styling
- OAuth callback handler at `/auth/callback` — exchanges code for session
- Auto-profile creation via Postgres trigger on `auth.users` insert
- Next.js middleware (`src/middleware.ts`) — session refresh, route protection, admin guard
- `UserProvider` context — dynamic user data in sidebar, topbar, all pages
- Admin role check via `ADMIN_USER_IDS` env var (server + client)

### Database (COMPLETE)
- Drizzle ORM with `postgres.js` driver, SSL, hot-reload protection
- 6 tables: `profiles`, `projects`, `tasks`, `video_outputs`, `token_transactions`, `notifications`
- 4 enums: `project_status`, `task_status`, `video_status`, `token_tx_type`
- Proper indexes on tasks (project_id, assigned_to, status), token_transactions (user_id), notifications (user_id + read)
- Query functions in `src/lib/db/queries/`: profiles, projects, tasks, tokens, notifications

### API Routes (COMPLETE)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects` | GET | List active projects with task counts |
| `/api/projects` | POST | Admin: create project + generate tasks from scenes |
| `/api/projects/[id]` | GET | Single project + task list |
| `/api/tasks/[id]` | GET | Single task + parent project info |
| `/api/tasks/[id]/claim` | POST | Claim task (3-active limit, 24h expiry) |
| `/api/tasks/[id]/submit` | POST | Verify Drive link + submit task |
| `/api/tasks/[id]/review` | POST | Admin: approve (credit tokens) or reject |
| `/api/drive/verify` | POST | Google Drive API v3 file metadata check |
| `/api/wallet` | GET | Token balance + transaction history |
| `/api/leaderboard` | GET | Ranked users by token balance |
| `/api/admin/submissions` | GET | Admin: pending review tasks with user + video metadata |

### Drive Verification (COMPLETE)
- `src/lib/drive/verify.ts` — extracts file ID from 2 URL patterns, calls Google Drive API v3
- Validates: file exists (404), mimeType = video/*, size 1MB–500MB
- Graceful fallback when API key not configured

### Token Economy (COMPLETE)
- Append-only ledger in `token_transactions` table
- Atomic credit: insert transaction + increment `profiles.tokenBalance` in single Postgres transaction
- Token types: `task_reward`, `bonus`, `deduction`, `withdrawal_request`

### Pages — All Wired to Real Data
| Page | Route | Data Source | Status |
|------|-------|-------------|--------|
| Landing | `/` | Static content | DONE (fake stats remain) |
| Login | `/login` | Supabase Auth | DONE |
| Dashboard | `/dashboard` | Supabase client SDK | DONE |
| Projects List | `/projects` | `GET /api/projects` | DONE |
| Project Detail | `/projects/[id]` | `GET /api/projects/[id]` | DONE |
| Task Detail | `/projects/[id]/tasks/[taskId]` | `GET /api/tasks/[id]` + claim/verify/submit | DONE |
| My Tasks | `/tasks` | Supabase client SDK | DONE |
| Wallet | `/wallet` | Supabase client SDK | DONE |
| Leaderboard | `/leaderboard` | Supabase client SDK | DONE |
| Profile | `/profile` | Supabase client SDK + useUser() | DONE |
| Admin Review | `/admin/review` | `GET /api/admin/submissions` | DONE |
| Admin Create | `/admin/projects/new` | `POST /api/projects` | DONE |
| 404 | `/not-found` | Static | DONE |

### Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| `UserProvider.tsx` | 78 | React Context: user, profile, loading, signOut |
| `Sidebar.tsx` | 133 | Desktop sidebar (280px) + mobile bottom nav, admin links |
| `Topbar.tsx` | 43 | Page header with title, right slot, optional avatar |
| `GlassCard.tsx` | 37 | Glass card (default/purple/cyan variants) |
| `Badge.tsx` | 32 | Status badges (green/amber/purple/red/cyan/gray) |
| `StatCard.tsx` | 37 | Animated stat card with framer-motion |
| `PageShell.tsx` | 19 | Layout wrapper: optional sticky topbar + scrollable body |
| `EmptyState.tsx` | 45 | Empty state placeholder with icon, title, CTA |

---

## File Inventory

```
src/
├── middleware.ts                                  # Next.js middleware (session refresh + route guards)
├── app/
│   ├── layout.tsx                                 # Root layout — Inter font, Toaster (sonner)
│   ├── globals.css                                # Tailwind v4 + glassmorphism tokens + utilities
│   ├── page.tsx                                   # Landing page (hero, how-it-works, features, CTA)
│   ├── not-found.tsx                              # Custom 404 page
│   ├── favicon.ico
│   ├── (auth)/login/page.tsx                      # Google OAuth login
│   ├── auth/callback/route.ts                     # OAuth callback handler
│   ├── (app)/
│   │   ├── layout.tsx                             # Dashboard shell — UserProvider + Sidebar + main
│   │   ├── dashboard/page.tsx                     # Stats, recent tasks, active projects
│   │   ├── projects/page.tsx                      # Project grid, search, filter chips
│   │   ├── projects/[id]/page.tsx                 # Project detail + task list with status badges
│   │   ├── projects/[id]/tasks/[taskId]/page.tsx  # Full task lifecycle: claim/verify/submit
│   │   ├── tasks/page.tsx                         # My claimed tasks list
│   │   ├── wallet/page.tsx                        # Token balance + transaction history
│   │   ├── leaderboard/page.tsx                   # Top-3 podium + ranked table
│   │   ├── profile/page.tsx                       # Bio edit, trust level ladder, activity
│   │   ├── admin/review/page.tsx                  # Review submissions (approve/reject with notes)
│   │   └── admin/projects/new/page.tsx            # Create project + scene builder
│   └── api/
│       ├── projects/route.ts                      # GET (list w/ counts), POST (create)
│       ├── projects/[id]/route.ts                 # GET (project + tasks)
│       ├── tasks/[id]/route.ts                    # GET (task + project)
│       ├── tasks/[id]/claim/route.ts              # POST (claim)
│       ├── tasks/[id]/submit/route.ts             # POST (verify + submit)
│       ├── tasks/[id]/review/route.ts             # POST (approve/reject + tokens)
│       ├── drive/verify/route.ts                  # POST (Drive API check)
│       ├── wallet/route.ts                        # GET (balance + transactions)
│       ├── leaderboard/route.ts                   # GET (ranked users)
│       └── admin/submissions/route.ts             # GET (pending review list)
├── components/
│   ├── UserProvider.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── GlassCard.tsx
│   ├── Badge.tsx
│   ├── StatCard.tsx
│   ├── PageShell.tsx
│   └── EmptyState.tsx
└── lib/
    ├── utils.ts                                   # cn() utility (clsx + tailwind-merge)
    ├── supabase/
    │   ├── client.ts                              # Browser Supabase client
    │   ├── server.ts                              # Server Supabase client (cookies)
    │   └── middleware.ts                           # updateSession() + adminClient()
    ├── db/
    │   ├── index.ts                               # Drizzle client (postgres.js, SSL, singleton)
    │   ├── schema.ts                              # 6 tables, 4 enums, 6 exported types
    │   └── queries/
    │       ├── profiles.ts                        # getProfile, updateProfile, getLeaderboard
    │       ├── projects.ts                        # listProjectsWithCounts, getProject, getProjectWithTasks, createProject
    │       ├── tasks.ts                           # getTask, getAdminSubmissions, listTasks, getMyTasks, claimTask, submitTask, reviewTask
    │       ├── tokens.ts                          # creditTokens, getBalance, getTransactions
    │       └── notifications.ts                   # getNotifications, markRead, createNotification
    └── drive/
        └── verify.ts                              # extractFileId, verifyDriveLink (Google Drive API v3)
```

---

## Dependencies

```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.98.0",
  "clsx": "^2.1.1",
  "drizzle-orm": "^0.45.1",
  "framer-motion": "^12.34.3",
  "lucide-react": "^0.575.0",
  "next": "16.1.6",
  "postgres": "^3.4.8",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "sonner": "^2.0.7",
  "tailwind-merge": "^3.5.0"
}
```

Dev: `@tailwindcss/postcss` ^4, `drizzle-kit` ^0.31.9, `eslint`, `eslint-config-next`, `tailwindcss` ^4, `typescript` ^5

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kiijaxysvydqkfzbrqeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:...@db.kiijaxysvydqkfzbrqeo.supabase.co:5432/postgres
ADMIN_USER_IDS=d7eb0e45-9c91-4f01-8bfc-698ee05b9335
NEXT_PUBLIC_ADMIN_USER_IDS=d7eb0e45-9c91-4f01-8bfc-698ee05b9335
GOOGLE_DRIVE_API_KEY=AIzaSy...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All env vars are populated. No empty values.

---

## Architecture Decisions (Locked In)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Framework | Next.js 16.1.6 (App Router) + TypeScript | SSR, server components, API routes |
| 2 | Database | PostgreSQL via Supabase (free tier) | 500MB DB, auth, RLS, free |
| 3 | Auth | Supabase Auth (Google OAuth) | Users need Google accounts for Drive anyway |
| 4 | ORM | Drizzle ORM | Lighter than Prisma, better SQL control |
| 5 | Video storage | Google Drive (user's own) | Zero cost, 15GB per user, store only URL |
| 6 | Styling | Tailwind CSS v4 + custom glassmorphism utilities | Dark theme, glass cards, mesh gradients |
| 7 | UI components | Custom (GlassCard, Badge, etc.) + Framer Motion | Built on top of Tailwind, not shadcn |
| 8 | Toasts | Sonner | Lightweight, dark theme support |
| 9 | Token system | Points only at launch, no real money | No revenue yet, legal protection |
| 10 | Data fetching | Client-side (useEffect + Supabase SDK or fetch()) | Consistent SPA-style across all pages |
| 11 | Admin panel | Built into app, not separate | Only admin at launch |
| 12 | Middleware | src/middleware.ts (Next.js 16 compatible) | Session refresh + route protection |

---

## What's Left — Remaining Items

### High Priority (Before Deploy)
| Item | Effort | Description |
|------|--------|-------------|
| Topbar hardcoded name | Small | `Topbar.tsx` line 36 shows "Arjun Sharma" when `showUserAvatar` is true — use `useUser()` instead |
| Landing page fake stats | Small | Remove or replace "10,000+ Tasks", "3,500+ Members" with real counts or honest copy |
| Deploy to Vercel | Small | Connect repo, set env vars, deploy |

### Medium Priority (Post-Deploy Polish)
| Item | Effort | Description |
|------|--------|-------------|
| Notifications UI | Medium | Wire bell icon in sidebar to real notifications from DB (data layer exists, UI doesn't) |
| Leaderboard time filter | Small | Add `?period=week\|month\|all` to API + UI tab switching |
| "Active" filter bug | Tiny | Projects page "Active" chip matches everything — should filter differently from "All" |
| `approval_rate` computation | Small | Field exists in schema, never computed — update on each review |
| `StatCard.tsx` "use client" | Tiny | Missing directive — fragile if used from a server component |
| Input validation (Zod) | Medium | No API routes validate input — all trust raw `req.json()` casts |

### Low Priority (v1.1+)
| Item | Effort | Description |
|------|--------|-------------|
| Task expiry enforcement | Medium | 24h claim expiry is set in DB but never enforced — needs cron/scheduled job |
| Auto trust level upgrades | Small | Milestones exist in UI but no trigger to bump trust_level |
| Dead code cleanup | Tiny | `adminClient()` unused export, `getMyTasks` unused import in review route |
| Drive URL patterns | Tiny | Only 2 regex patterns; plan specified 4 |
| Rate limiting | Medium | `/api/drive/verify` has no auth — anyone can probe Drive metadata |

### Future Versions (from plan.md)
- **v1.1:** Video merge automation (Fly.io + FFmpeg)
- **v1.2:** YouTube integration (upload + revenue tracking)
- **v1.5:** Token redemption (UPI/PayPal payouts)
- **v2.0:** User-created campaigns (marketplace)

---

## Risks to Remember

1. **AI Tool ToS** — Coordinated free-tier farming may violate terms. Position as "use tools you already have." Support open-source models.
2. **YouTube AI Policy** — Must disclose AI content. Revenue may be limited. Diversify platforms.
3. **Unit Economics** — YouTube CPM for AI content is $1-4/1K views. Don't promise real money until revenue is proven.
4. **Drive Link Rot** — Users may delete files. Re-verify before merge. Notify users if link breaks.
5. **Token Fraud** — Garbage submissions to farm tokens. Mandatory review + progressive trust levels.
6. **Supabase Free Tier** — Pauses after 1 week inactivity. Set up a keep-alive ping.
