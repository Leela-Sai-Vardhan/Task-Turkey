# Task Turkey — Progress Snapshot

> Last updated: 2026-03-06
> Status: **MVP live on Vercel. SEO configured. All audit fixes applied.**
> Next step: **Post-deploy polish (v1.1)**

---

## Quick Resume Prompt

When starting a new session, say:

> "Read `PROGRESS.md` and `plan.md` at `D:\TaskForge\task-turkey` and continue building Task Turkey."

---

## What This Project Is

Task Turkey is a crowdsourced micro-task platform where users contribute their free-tier AI tool usage (Kling, Runway, Hailuo, Wan 2.1) to collectively produce monetizable YouTube videos. Users claim tasks, copy prompts, generate video clips externally, paste Google Drive links (no file uploads — zero storage cost), get reviewed, and earn tokens.

Key concept: Users store videos on their own Google Drive (15GB free). Task Turkey stores only the URL string. This eliminates storage costs entirely.

---

## Deployment Status

| Service | Status | URL / Notes |
|---------|--------|-------------|
| **Vercel** | ✅ Live | https://task-turkey.vercel.app |
| **GitHub** | ✅ Pushed | https://github.com/Leela-Sai-Vardhan/Task-Turkey |
| **Supabase** | ✅ Connected | kiijaxysvydqkfzbrqeo.supabase.co |
| **Google Search Console** | ✅ Verified | Sitemap submitted |
| **Bing Webmaster Tools** | ✅ Verified | URLs submitted manually |
| **Google OAuth** | ✅ Tested & working | Redirect URLs configured in Supabase |

---

## What's Built — Complete Feature List

### Authentication ✅
- Google OAuth via Supabase Auth — full end-to-end flow
- Login page at `/login` with Suspense boundary (required for Next.js 16 static builds)
- OAuth callback at `/auth/callback` with open-redirect protection (validates `next` param)
- Auto-profile creation via Postgres trigger on `auth.users` insert
- Next.js middleware (`src/middleware.ts`) — session refresh, route protection, admin guard
- `returnTo` redirect support — users sent back to intended page after login
- `UserProvider` context — dynamic user data in sidebar, topbar, all pages
- Admin role via `ADMIN_USER_IDS` (server) + `NEXT_PUBLIC_ADMIN_USER_IDS` (client) — intentional split

### Database ✅
- Drizzle ORM with `postgres.js` driver, SSL, hot-reload singleton protection
- 6 tables: `profiles`, `projects`, `tasks`, `video_outputs`, `token_transactions`, `notifications`
- 4 enums: `project_status`, `task_status`, `video_status`, `token_tx_type`
- Indexes: tasks (project_id+status, assigned_to+status), token_transactions (user_id), notifications (user_id, unread)
- `get_lifetime_earned` Postgres RPC function for accurate wallet aggregation

### API Routes ✅
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects` | GET | List active projects with task counts |
| `/api/projects` | POST | Admin: create project + generate tasks |
| `/api/projects/[id]` | GET | Single project + task list |
| `/api/tasks/[id]` | GET | Single task + parent project |
| `/api/tasks/[id]/claim` | POST | Atomic claim (3-active limit via subquery) |
| `/api/tasks/[id]/submit` | POST | Verify Drive link + submit (transactional) |
| `/api/tasks/[id]/review` | POST | Admin: approve/reject (full DB transaction) |
| `/api/drive/verify` | POST | Google Drive API v3 check (auth required) |
| `/api/wallet` | GET | Token balance + transaction history |
| `/api/leaderboard` | GET | Ranked users by token balance |
| `/api/admin/submissions` | GET | Admin: pending review queue |
| `/api/notifications` | GET | User notifications |
| `/api/notifications/read-all` | POST | Bulk mark all notifications as read |
| `/api/stats` | GET | Live stats for landing page (force-dynamic) |

### Security & Correctness Fixes (Audit Phase) ✅
- **Atomic claimTask** — count check + update in single SQL subquery, no race condition
- **Status guards** — `submitTask` checks `assigned`, `reviewTask` checks `pending_review`
- **DB transactions** — submit route and review route wrapped in Drizzle transactions
- **Open redirect fix** — `/auth/callback` validates `next` param, rejects external URLs
- **Drive verify auth** — `/api/drive/verify` requires authentication (was open)
- **Drive fallback** — returns `valid: false` when `GOOGLE_DRIVE_API_KEY` missing
- **Centralized `isAdmin`** — shared utility in `lib/auth/admin.ts`
- **Standardized Supabase client** — all routes use shared `createClient` from `lib/supabase/server`
- **Protected routes** — `/notifications` added to middleware protected paths

### UI/UX Fixes ✅
- Leaderboard podium correctly handles 1, 2, or 3 users
- Notification items are clickable with correct action URLs
- HTML validity: no `<button>` nested in `<Link>` anywhere
- Dashboard progress bar shows real approved/total task ratio
- Project filters: "Active" (some tasks open) vs "Hiring" (all tasks open) — clear semantics
- Mobile nav: Dashboard, Projects, Tasks, Notifications, Profile
- Topbar: real user name from `useUser()` (not hardcoded)

### Pre-Deploy Polish ✅
- SEO metadata in `layout.tsx`: title template, description, keywords
- OpenGraph tags: type, URL, title, description, siteName
- Twitter card metadata: `summary_large_image`
- `sitemap.ts` — auto-generates `/sitemap.xml` with all 5 public pages
- `robots.ts` — auto-generates `/robots.txt` (allows all, blocks `/api/` and `/admin/`)
- Middleware exclusions: `sitemap.xml`, `robots.txt`, `.html` bypass auth session check
- Google Search Console verification file in `public/`
- Landing page: real stats from `/api/stats` (task count, member count, tokens awarded)
- Wallet: accurate `lifetimeEarned` via `get_lifetime_earned` RPC (not limited query)

### Pages ✅
| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Real stats, honest copy, full OG metadata |
| Login | `/login` | ✅ Suspense-wrapped, `returnTo` support |
| Dashboard | `/dashboard` | ✅ Real data, real progress bar |
| Projects List | `/projects` | ✅ Search, filter chips (Active/Hiring) |
| Project Detail | `/projects/[id]` | ✅ Description, style guide, task counts |
| Task Detail | `/projects/[id]/tasks/[taskId]` | ✅ Full claim/verify/submit lifecycle |
| My Tasks | `/tasks` | ✅ |
| Wallet | `/wallet` | ✅ Accurate lifetime earnings |
| Leaderboard | `/leaderboard` | ✅ Real podium (1–3 users), rank API |
| Profile | `/profile` | ✅ |
| Notifications | `/notifications` | ✅ Clickable items, bulk read-all |
| Admin Review | `/admin/review` | ✅ |
| Admin Create | `/admin/projects/new` | ✅ |
| 404 | `/not-found` | ✅ |

---

## File Inventory

```
src/
├── middleware.ts                                  # Session refresh + route guards + crawler exclusions
├── app/
│   ├── layout.tsx                                 # Root layout — fonts, Toaster, full OG metadata
│   ├── globals.css                                # Tailwind v4 + glassmorphism tokens
│   ├── page.tsx                                   # Landing page — real stats, honest copy
│   ├── not-found.tsx                              # Custom 404
│   ├── sitemap.ts                                 # Auto-generates /sitemap.xml
│   ├── robots.ts                                  # Auto-generates /robots.txt
│   ├── (auth)/login/page.tsx                      # Google OAuth login (Suspense wrapped)
│   ├── auth/callback/route.ts                     # OAuth callback (open-redirect protected)
│   ├── (app)/
│   │   ├── layout.tsx                             # Dashboard shell — UserProvider + Sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── projects/[id]/tasks/[taskId]/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── wallet/page.tsx                        # lifetimeEarned via RPC
│   │   ├── leaderboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── admin/review/page.tsx
│   │   └── admin/projects/new/page.tsx
│   └── api/
│       ├── projects/route.ts
│       ├── projects/[id]/route.ts
│       ├── tasks/[id]/route.ts
│       ├── tasks/[id]/claim/route.ts              # Atomic subquery
│       ├── tasks/[id]/submit/route.ts             # Transactional
│       ├── tasks/[id]/review/route.ts             # Full DB transaction
│       ├── drive/verify/route.ts                  # Auth required
│       ├── wallet/route.ts
│       ├── leaderboard/route.ts
│       ├── admin/submissions/route.ts
│       ├── notifications/route.ts
│       ├── notifications/read-all/route.ts
│       └── stats/route.ts                         # force-dynamic, real DB counts
├── components/
│   ├── UserProvider.tsx
│   ├── Sidebar.tsx                                # Admin links, mobile nav
│   ├── Topbar.tsx                                 # Real username from useUser()
│   ├── GlassCard.tsx
│   ├── Badge.tsx
│   ├── StatCard.tsx
│   ├── PageShell.tsx
│   └── EmptyState.tsx
└── lib/
    ├── utils.ts
    ├── auth/
    │   └── admin.ts                               # Centralized isAdmin() utility
    ├── supabase/
    │   ├── client.ts
    │   ├── server.ts
    │   └── middleware.ts                          # updateSession()
    ├── db/
    │   ├── index.ts                               # Drizzle singleton
    │   ├── schema.ts
    │   └── queries/
    │       ├── profiles.ts
    │       ├── projects.ts
    │       ├── tasks.ts                           # Atomic claimTask, status guards
    │       ├── tokens.ts
    │       └── notifications.ts
    └── drive/
        └── verify.ts                              # Google Drive API v3

public/
└── google1607f888041f4f58.html                    # Google Search Console verification
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kiijaxysvydqkfzbrqeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
ADMIN_USER_IDS=d7eb0e45-9c91-4f01-8bfc-698ee05b9335
NEXT_PUBLIC_ADMIN_USER_IDS=d7eb0e45-9c91-4f01-8bfc-698ee05b9335
GOOGLE_DRIVE_API_KEY=AIzaSy...
```

All env vars set in `.env.local` (local) and Vercel dashboard (production).

---

## Architecture Decisions (Locked In)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Framework | Next.js 16.1.6 (App Router) + TypeScript | SSR, API routes, static generation |
| 2 | Database | PostgreSQL via Supabase (free tier) | 500MB DB, auth, RLS |
| 3 | Auth | Supabase Auth (Google OAuth) | Users need Google accounts for Drive anyway |
| 4 | ORM | Drizzle ORM | Lighter than Prisma, better SQL control |
| 5 | Video storage | Google Drive (user's own) | Zero cost, store only URL |
| 6 | Styling | Tailwind CSS v4 + glassmorphism | Dark theme, glass cards, mesh gradients |
| 7 | Admin env var split | `ADMIN_USER_IDS` (server) + `NEXT_PUBLIC_ADMIN_USER_IDS` (client) | Intentional — different security contexts |
| 8 | Atomicity | Inline SQL subquery for claimTask, Drizzle transactions for submit/review | Balance between safety and complexity |
| 9 | Dynamic API routes | `force-dynamic` on `/api/stats` | Prevents build-time DB prerender failures on Vercel |

---

## What's Left — Remaining Items

### Medium Priority (Post-Deploy Polish)
| Item | Effort | Description |
|------|--------|-------------|
| Leaderboard time filter | Small | `?period=week\|month\|all` to API + UI tab switching |
| `approval_rate` computation | Small | Field exists in schema, never computed — update on each review |
| Input validation (Zod) | Medium | No API routes validate input — all trust raw `req.json()` casts |

### Low Priority (v1.1+)
| Item | Effort | Description |
|------|--------|-------------|
| Task expiry enforcement | Medium | 24h claim expiry set in DB but never enforced — needs cron job |
| Auto trust level upgrades | Small | Milestones in UI but no trigger to bump `trust_level` |
| Dead code cleanup | Tiny | Minor unused exports |
| Drive URL patterns | Tiny | Only 2 regex patterns; plan specified 4 |
| Rate limiting | Medium | `/api/drive/verify` has no rate limiting |
| Avatar image support | Small | `avatar_url` stored but not displayed |
| OG image | Small | Add a real `og-image.png` to `/public` for rich link previews |

### Future Versions (from plan.md)
- **v1.1:** Video merge automation (Fly.io + FFmpeg)
- **v1.2:** YouTube integration (upload + revenue tracking)
- **v1.5:** Token redemption (UPI/PayPal payouts)
- **v2.0:** User-created campaigns (marketplace)

---

## Risks to Remember

1. **AI Tool ToS** — Coordinated free-tier farming may violate terms. Position as "use tools you already have."
2. **YouTube AI Policy** — Must disclose AI content. Revenue may be limited.
3. **Unit Economics** — YouTube CPM for AI content is $1–4/1K views. Don't promise real money until revenue is proven.
4. **Drive Link Rot** — Users may delete files. Re-verify before merge.
5. **Token Fraud** — Garbage submissions to farm tokens. Mandatory review + progressive trust levels.
6. **Supabase Free Tier** — Pauses after 1 week inactivity. Set up a keep-alive ping.
