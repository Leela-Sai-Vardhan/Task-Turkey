# Task Turkey — Project Plan

> A crowdsourced micro-task platform where users contribute their free-tier AI tool usage to collectively produce monetizable content.

---

## Table of Contents

1. [Concept Overview](#1-concept-overview)
2. [Core Loop & User Flow](#2-core-loop--user-flow)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Folder Structure](#6-folder-structure)
7. [Key Feature Modules](#7-key-feature-modules)
8. [Drive Link Verification Flow](#8-drive-link-verification-flow)
9. [Glassmorphism Design System](#9-glassmorphism-design-system)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Key Decisions Log](#12-key-decisions-log)

---

## 1. Concept Overview

### What Is Task Turkey?

Task Turkey is a platform that coordinates large groups of students and people with laptops to collectively produce monetizable content — primarily AI-generated videos — using their individual free-tier access to AI tools.

### The Problem

- AI video generation tools (Kling, Runway, Hailuo, Wan 2.1) offer limited free-tier usage per account.
- A single user's free-tier produces 1–3 short clips — not enough for a full video.
- Students and people want a stable side income but lack capital, tools, or direction.

### The Solution

- Break a video project into N scenes, each with a specific prompt.
- Distribute one scene per user — each uses their own free-tier AI tool.
- Collect all clips, merge into a cinema-quality video.
- Monetize on YouTube (and other platforms).
- Reward users with tokens redeemable for money once revenue flows.

### Two Modes (v1 has only Mode 1)

| Mode | Description | Version |
|------|-------------|---------|
| **Platform Projects** | Admin creates campaigns (e.g., YouTube video pipelines) | v1 (MVP) |
| **User-Created Campaigns** | Any user can create a project and recruit workers | v2+ |

---

## 2. Core Loop & User Flow

```
PROJECT CREATED (by admin)
    │
    ▼
TASKS DISTRIBUTED (1 scene = 1 task, with prompt + instructions)
    │
    ▼
USER CLAIMS TASK
    │
    ▼
USER COPIES PROMPT → Goes to AI tool (Kling, Runway, etc.) → Generates clip
    │
    ▼
USER UPLOADS CLIP TO THEIR GOOGLE DRIVE (free, 15GB per account)
    │
    ▼
USER PASTES GOOGLE DRIVE LINK on Task Turkey
    │
    ▼
PLATFORM VERIFIES LINK (accessible, correct format, valid video)
    │
    ▼
ADMIN REVIEWS SUBMISSION (approve / reject with notes)
    │
    ▼
APPROVED → TOKENS CREDITED to user's wallet
    │
    ▼
ALL TASKS COMPLETE → CLIPS MERGED (manually in v1, automated in v1.5+)
    │
    ▼
VIDEO PUBLISHED TO YOUTUBE → Revenue tracked
    │
    ▼
TOKENS BECOME REDEEMABLE (once revenue milestones are hit)
```

### Why Google Drive Links (Not File Uploads)?

Users store videos on their own Google Drive (15GB free per Google account). Task Turkey's database stores only a URL string. This eliminates the biggest cost bottleneck — video storage.

**10,000 video submissions = a few KB of text in Postgres. Zero storage cost.**

Problems this introduces and how we solve them:

| Problem | Solution |
|---------|----------|
| **Link rot** (user deletes file) | Background job validates link on submission. Re-verify before merge. |
| **Permission issues** | UI guides user to set "Anyone with the link." Auto-detect 403 errors, notify user. |
| **Quality verification** | On submission, fetch file headers (Content-Type, Content-Length). Reject wrong format or suspiciously small files. Full download only during merge. |
| **Download throttling** | During merge, download all clips to worker's ephemeral disk, process, discard. Don't stream from Drive. |

---

## 3. Tech Stack

### Zero-Budget Stack (All Free Tiers)

| Layer | Technology | Monthly Cost | Why This |
|-------|-----------|-------------|----------|
| **Framework** | Next.js 15 (App Router) + TypeScript | $0 | SSR, API routes, server actions, massive ecosystem |
| **Database** | PostgreSQL via Supabase (free) | $0 | 500MB DB, relational data, JSONB, RLS policies |
| **Auth** | Supabase Auth (Google OAuth) | $0 | Users already have Google accounts for Drive. No redundant auth layer. |
| **ORM** | Drizzle ORM | $0 | Type-safe, lightweight, great migration tooling |
| **Styling** | Tailwind CSS v4 | $0 | Utility-first, perfect for glassmorphism utilities |
| **UI Components** | shadcn/ui + Framer Motion | $0 | Composable, customizable, great animation support |
| **Video Storage** | User's Google Drive | $0 | 15GB free per user. We store only the link URL. |
| **Job Queue** | Upstash Redis (free) | $0 | 10K commands/day. Enough for early-stage queuing. |
| **Background Workers** | Fly.io (free: 3 shared VMs) | $0 | Video merge worker, Drive verification, job processor |
| **Video Processing** | FFmpeg on Fly.io worker | $0 | Merge clips, normalize resolution/fps, transitions |
| **Hosting** | Vercel (free) | $0 | Best Next.js hosting. 100GB bandwidth, edge functions. |
| **DNS** | Cloudflare (free) | $0 | DNS, DDoS protection, SSL |
| **Monitoring** | Sentry (free: 5K events/mo) | $0 | Error tracking |
| **Analytics** | PostHog (free: 1M events/mo) | $0 | Product analytics, session replay |
| **Total** | | **$0/month** | |

### First Paid Upgrade (When Needed)

| Upgrade | Cost | What It Unlocks |
|---------|------|----------------|
| Supabase Pro | $25/mo | 8GB DB, 100GB storage, daily backups, no pause on inactivity |
| Vercel Pro | $20/mo | No bandwidth cap, 300s function timeout, team features |
| Upstash Pro | $10/mo | 200K commands/day, larger storage |

### Free Tier Limits to Watch

| Service | Limit That Matters | When You'll Hit It |
|---------|-------------------|-------------------|
| Supabase | 500MB DB, pauses after 1 week inactivity | ~50K rows, or if you stop developing for a week |
| Vercel | 10s serverless function timeout | Drive verification for large files may timeout |
| Upstash Redis | 10K commands/day | ~500 active users/day with normal usage |
| Fly.io | 3 shared VMs, 256MB RAM each | FFmpeg merging large/many clips will OOM |

### External API Keys Required

| API | Purpose | Cost |
|-----|---------|------|
| Google Cloud API Key | Drive file verification (read-only, public files) | Free (no billing required) |
| YouTube Data API v3 | Video upload + analytics (v1.5+) | Free (10K quota units/day) |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USER FLOW                              │
│                                                          │
│  Browse Projects → Claim Task → Copy Prompt              │
│       → Use AI Tool (external) → Upload to Google Drive  │
│            → Paste Drive Link → Submit                   │
│                → Await Review → Earn Tokens              │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                 Vercel (Free Tier)                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Next.js 15 (App Router)                  │  │
│  │                                                    │  │
│  │  /app                                              │  │
│  │  ├── (marketing)/   → Landing page                 │  │
│  │  ├── (auth)/        → Login / Register             │  │
│  │  ├── (dashboard)/   → Main authenticated app       │  │
│  │  │   ├── projects/  → Browse & detail              │  │
│  │  │   ├── tasks/     → My tasks, submit Drive link  │  │
│  │  │   ├── wallet/    → Token balance & history      │  │
│  │  │   ├── leaderboard/                              │  │
│  │  │   └── profile/   → Settings                     │  │
│  │  ├── admin/         → Project CRUD, review panel   │  │
│  │  └── /api           → REST endpoints               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────────────────┘
               │
    ┌──────────┼──────────────────┐
    ▼          ▼                  ▼
┌────────┐ ┌──────────────┐ ┌──────────────────────────┐
│Supabase│ │Upstash Redis │ │  Fly.io (Free 3 VMs)     │
│ (Free) │ │  (Free)      │ │                          │
│        │ │              │ │  Worker Process:          │
│- PgSQL │ │- Rate limits │ │  1. Poll for merge jobs  │
│- Auth  │ │- Job queue   │ │  2. Validate Drive links │
│- RLS   │ │- Caching     │ │  3. Download clips       │
│- Edge  │ │              │ │  4. FFmpeg merge          │
│  Funcs │ │              │ │  5. Upload to YouTube     │
└────────┘ └──────────────┘ └──────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Google APIs     │
                              │  - Drive (verify │
                              │    & download)   │
                              │  - YouTube Data  │
                              │    API v3 (v1.5) │
                              └─────────────────┘
```

---

## 5. Database Schema

### Entity Relationship Diagram

```
profiles ──────< token_transactions
    │
    ├──< projects ──< tasks
    │                   │
    │                   └──> profiles (assigned_to)
    │
    ├──< projects ──< video_outputs
    │
    └──< notifications
```

### SQL Schema

```sql
-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio VARCHAR(500),
    trust_level SMALLINT DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 5),
    -- 0=new, 1=email_verified, 2=task_completed, 3=trusted, 4=expert, 5=admin
    tasks_completed INT DEFAULT 0,
    tokens_earned DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'video_pipeline',
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','active','paused','completed','cancelled')),

    cover_image_url TEXT,
    reward_per_task DECIMAL(8,2) NOT NULL,
    max_tasks_per_user INT DEFAULT 1,
    min_trust_level SMALLINT DEFAULT 0,

    -- Flexible config (video pipeline settings, model suggestions, etc.)
    config JSONB NOT NULL DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    deadline TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS (core unit of work)
-- ============================================

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),

    sequence_order INT NOT NULL,
    title VARCHAR(200) NOT NULL,

    -- The prompt the user copies
    prompt_text TEXT NOT NULL,
    -- Additional markdown instructions
    instructions TEXT,
    -- Which AI tool to use, settings, etc.
    tool_suggestions JSONB DEFAULT '[]',

    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN (
            'available','assigned','submitted',
            'in_review','approved','rejected','expired'
        )),
    reward_tokens DECIMAL(8,2) NOT NULL,

    -- Submission (Google Drive link)
    drive_link TEXT,
    drive_link_verified BOOLEAN DEFAULT FALSE,
    drive_link_verified_at TIMESTAMPTZ,
    drive_file_metadata JSONB,  -- {file_name, file_size, mime_type, accessible}
    submitted_at TIMESTAMPTZ,

    -- Review
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    review_rating SMALLINT CHECK (review_rating BETWEEN 1 AND 5),
    reviewed_at TIMESTAMPTZ,

    -- Assignment tracking
    assigned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    max_retries SMALLINT DEFAULT 2,
    retry_count SMALLINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_sequence CHECK (sequence_order > 0)
);

CREATE INDEX idx_tasks_available ON tasks(project_id, status)
    WHERE status = 'available';
CREATE INDEX idx_tasks_user ON tasks(assigned_to, status)
    WHERE assigned_to IS NOT NULL;

-- ============================================
-- TOKEN LEDGER (double-entry, append-only)
-- ============================================

CREATE TABLE public.token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL,           -- positive = credit, negative = debit
    running_balance DECIMAL(12,2) NOT NULL,  -- balance AFTER this transaction
    type VARCHAR(30) NOT NULL
        CHECK (type IN (
            'task_reward','bonus','referral',
            'redemption','adjustment'
        )),
    reference_id UUID,           -- task_id, project_id, etc.
    reference_type VARCHAR(20),  -- 'task', 'project', 'system'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_txn_user ON token_transactions(user_id, created_at DESC);

-- ============================================
-- VIDEO OUTPUTS (merged final videos)
-- ============================================

CREATE TABLE public.video_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id),

    merged_video_url TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','merging','merged','published','failed')),

    -- YouTube integration (v1.5+)
    youtube_video_id VARCHAR(20),
    youtube_title VARCHAR(200),
    youtube_status VARCHAR(20),
    youtube_published_at TIMESTAMPTZ,

    -- Revenue tracking
    view_count BIGINT DEFAULT 0,
    estimated_revenue_usd DECIMAL(10,2) DEFAULT 0,
    last_synced_at TIMESTAMPTZ,

    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (Supabase RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, self update
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Projects: public read, creator manages
CREATE POLICY "Projects are viewable by everyone" ON projects
    FOR SELECT USING (true);
CREATE POLICY "Creators manage own projects" ON projects
    FOR ALL USING (auth.uid() = creator_id);

-- Tasks: see available + own assigned
CREATE POLICY "Users see available and own tasks" ON tasks
    FOR SELECT USING (
        status = 'available' OR assigned_to = auth.uid()
    );
CREATE POLICY "Users update own tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

-- Transactions: own only
CREATE POLICY "Users see own transactions" ON token_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "Users see own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
```

### Config JSONB Shape (for video_pipeline projects)

```jsonc
{
  "story_title": "The Last Lighthouse",
  "story_summary": "A short cinematic about...",
  "model_suggestions": ["Kling 2.0", "Hailuo MiniMax", "Wan 2.1"],
  "target_resolution": "1080p",
  "clip_duration_seconds": 10,
  "aspect_ratio": "16:9",
  "style_guide": "Cinematic, moody lighting, slow camera movements",
  "reference_images": []
}
```

---

## 6. Folder Structure

```
Task Turkey/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                 # Landing page
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/page.tsx        # Supabase OAuth callback
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx               # Glass sidebar + nav
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx             # Browse projects
│   │   │   │   └── [id]/page.tsx        # Project detail + task list
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx             # My claimed tasks
│   │   │   │   └── [id]/page.tsx        # Task detail + submit Drive link
│   │   │   ├── wallet/page.tsx          # Token balance + transaction history
│   │   │   ├── leaderboard/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── admin/                       # Admin panel (you only, v1)
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx             # List & manage projects
│   │   │   │   ├── new/page.tsx         # Create project + generate tasks
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # Edit project
│   │   │   │       └── review/page.tsx  # Review submissions
│   │   │   └── users/page.tsx           # User management
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts   # Supabase auth callback handler
│   │   │   ├── projects/route.ts        # GET (list), POST (create)
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts             # GET (list my tasks)
│   │   │   │   ├── [id]/claim/route.ts  # POST (claim a task)
│   │   │   │   ├── [id]/submit/route.ts # POST (submit Drive link)
│   │   │   │   └── [id]/review/route.ts # POST (approve/reject)
│   │   │   ├── wallet/route.ts          # GET (balance + history)
│   │   │   └── drive/verify/route.ts    # POST (verify Drive link)
│   │   ├── layout.tsx                   # Root layout
│   │   └── globals.css                  # Tailwind + glassmorphism tokens
│   ├── components/
│   │   ├── ui/                          # shadcn/ui + custom glass components
│   │   │   ├── glass-card.tsx
│   │   │   ├── glass-button.tsx
│   │   │   ├── glass-input.tsx
│   │   │   ├── glass-sidebar.tsx
│   │   │   ├── glass-modal.tsx
│   │   │   └── ...shadcn primitives     # button, input, dialog, etc.
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── mesh-gradient-bg.tsx     # Animated background
│   │   │   └── footer.tsx
│   │   ├── projects/
│   │   │   ├── project-card.tsx
│   │   │   ├── project-grid.tsx
│   │   │   └── task-list.tsx
│   │   ├── tasks/
│   │   │   ├── task-card.tsx
│   │   │   ├── prompt-display.tsx       # Copy-to-clipboard prompt block
│   │   │   ├── drive-link-input.tsx     # Paste + auto-verify Drive link
│   │   │   └── submission-status.tsx
│   │   └── wallet/
│   │       ├── balance-display.tsx
│   │       └── transaction-list.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client (createBrowserClient)
│   │   │   ├── server.ts               # Server client (createServerClient)
│   │   │   ├── middleware.ts            # Auth session refresh middleware
│   │   │   └── admin.ts                # Service role client (server only)
│   │   ├── db/
│   │   │   ├── schema.ts               # Drizzle ORM schema definitions
│   │   │   ├── queries/
│   │   │   │   ├── projects.ts          # Project queries
│   │   │   │   ├── tasks.ts             # Task queries (claim, submit, list)
│   │   │   │   ├── tokens.ts            # Credit/debit/balance queries
│   │   │   │   └── profiles.ts          # Profile queries
│   │   │   └── index.ts                 # Drizzle client instance
│   │   ├── drive/
│   │   │   └── verify.ts               # Google Drive link validation logic
│   │   ├── tokens/
│   │   │   └── ledger.ts               # Token credit/debit with double-entry
│   │   ├── validations/
│   │   │   └── schemas.ts              # Zod schemas for API validation
│   │   └── utils.ts                    # Shared helpers
│   ├── hooks/
│   │   ├── use-user.ts                 # Current user context
│   │   ├── use-tasks.ts                # Task-related client hooks
│   │   └── use-wallet.ts               # Wallet balance hook
│   └── types/
│       └── index.ts                    # Shared TypeScript types
├── supabase/
│   ├── migrations/                     # Auto-generated SQL migrations
│   │   └── 001_initial_schema.sql
│   └── config.toml                     # Supabase local config
├── workers/                            # Fly.io background workers (v1.5)
│   ├── video-merge.ts                  # FFmpeg merge pipeline
│   ├── drive-validator.ts              # Periodic link re-verification
│   └── Dockerfile
├── public/
│   ├── logo.svg
│   └── og-image.png
├── tailwind.config.ts
├── drizzle.config.ts
├── next.config.ts
├── middleware.ts                        # Supabase auth middleware (root)
├── package.json
├── tsconfig.json
├── .env.local.example
└── .gitignore
```

---

## 7. Key Feature Modules

### Module 1: Auth & Profiles

- Google OAuth via Supabase Auth (users already have Google accounts for Drive)
- Auto-create profile on first login (database trigger or server-side check)
- Trust level system: 0 (new) → 1 (verified) → 2 (completed tasks) → 3+ (trusted)
- Admin role: hardcoded admin user IDs in env vars for v1

### Module 2: Project Management (Admin Only in v1)

- Create project with title, description, story config
- Generate N tasks from a scene breakdown (manual input per scene)
- Set reward per task, deadline, minimum trust level
- Project status lifecycle: draft → active → paused → completed → cancelled
- Dashboard: track task completion progress per project

### Module 3: Task Engine

- **Browse:** Users see all `available` tasks across active projects
- **Claim:** User claims a task → status changes to `assigned`, `expires_at` set (24h)
- **Expiry:** Cron or delayed job releases uncompleted tasks back to `available`
- **Submit:** User pastes Google Drive link → auto-verification → status to `submitted`
- **Review:** Admin approves (tokens credited) or rejects (feedback, retry allowed)
- **Limits:** max_tasks_per_user per project, min_trust_level gate

### Module 4: Drive Link System

- URL parsing: extract Google Drive file ID from various URL formats
- Verification via Google Drive API (file metadata: name, size, MIME type)
- Status indicators in UI: verifying → verified → error (with specific message)
- Re-verification before merge (links can break between submission and merge)

### Module 5: Token Economy

- **Append-only ledger:** Every token movement is a transaction row with running balance
- **Credit triggers:** Task approved → `task_reward` transaction
- **Balance tracking:** `profiles.current_balance` updated atomically with each transaction
- **No redemption in v1.** Tokens accumulate. Users see their lifetime earnings.
- **Leaderboard:** Top earners, most tasks completed, highest rating — drives engagement

### Module 6: Glassmorphism UI

- Custom glass components built on top of shadcn/ui primitives
- Animated mesh gradient canvas background
- Frosted glass cards, nav, sidebar, modals
- Framer Motion for page transitions, card hover effects, status changes
- Dark theme only (glassmorphism looks bad on light backgrounds)

---

## 8. Drive Link Verification Flow

```
User pastes Drive link in UI
         │
         ▼
┌──────────────────────────────────────────┐
│  Client-Side (Instant)                   │
│                                          │
│  1. Regex validate URL format            │
│     ✓ drive.google.com/file/d/{id}/...   │
│     ✓ drive.google.com/open?id={id}      │
│     ✗ Reject non-Drive URLs              │
│                                          │
│  2. Extract file ID from URL             │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Server-Side: POST /api/drive/verify     │
│                                          │
│  1. Call Google Drive API v3 (read-only) │
│     GET googleapis.com/drive/v3/files/   │
│         {fileId}?fields=name,size,       │
│         mimeType&key={API_KEY}           │
│                                          │
│  2. Validate:                            │
│     - HTTP 200 (file is publicly shared) │
│     - mimeType starts with "video/"      │
│     - size > 1MB (not garbage/empty)     │
│     - size < 500MB (reasonable limit)    │
│                                          │
│  3. Store in tasks table:                │
│     - drive_link = URL                   │
│     - drive_link_verified = true         │
│     - drive_link_verified_at = NOW()     │
│     - drive_file_metadata = {            │
│         file_name, file_size, mime_type  │
│       }                                  │
└──────────────────┬───────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    ┌─────────┐        ┌──────────┐
    │ SUCCESS │        │ FAILURE  │
    │         │        │          │
    │ Task →  │        │ Return:  │
    │ submitted│       │ "Not     │
    │ Notify  │        │ accessible│
    │ reviewer│        │ / Not a  │
    └─────────┘        │ video /  │
                       │ Too small│
                       │ / Too    │
                       │ large"   │
                       └──────────┘
```

### Google Drive URL Patterns to Support

```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/open?id=FILE_ID
https://drive.google.com/uc?id=FILE_ID&export=download
```

### API Key Setup

1. Go to Google Cloud Console → Create project
2. Enable Google Drive API
3. Create API Key (restrict to Drive API only)
4. No billing required for read-only file metadata on public files
5. Store in `.env.local` as `GOOGLE_DRIVE_API_KEY`

---

## 9. Glassmorphism Design System

### Design Tokens

```css
/* === GLASSMORPHISM TOKENS === */

/* Backgrounds */
--bg-primary: #0a0a1a;
--bg-gradient: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%);

/* Accent Colors */
--accent-primary: #7c3aed;     /* Purple */
--accent-secondary: #06b6d4;   /* Cyan */
--accent-success: #10b981;     /* Green */
--accent-warning: #f59e0b;     /* Amber */
--accent-danger: #ef4444;      /* Red */

/* Glass Properties */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.08);
--glass-bg-active: rgba(255, 255, 255, 0.12);
--glass-border: rgba(255, 255, 255, 0.10);
--glass-border-hover: rgba(255, 255, 255, 0.20);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
--glass-blur: 16px;
--glass-blur-heavy: 24px;

/* Text */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.60);
--text-muted: rgba(255, 255, 255, 0.35);
```

### Glass Card Component Pattern

```css
.glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: var(--glass-shadow);
    transition: all 0.3s ease;
}
.glass-card:hover {
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
```

### Animated Mesh Gradient Background

Pure CSS (no JS library needed):

```css
.mesh-gradient {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: var(--bg-primary);
    overflow: hidden;
}
.mesh-gradient::before,
.mesh-gradient::after {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.3;
    animation: float 20s infinite ease-in-out;
}
.mesh-gradient::before {
    background: var(--accent-primary);
    top: -200px;
    left: -200px;
}
.mesh-gradient::after {
    background: var(--accent-secondary);
    bottom: -200px;
    right: -200px;
    animation-delay: -10s;
}
@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(100px, 50px) scale(1.1); }
    66% { transform: translate(-50px, 100px) scale(0.9); }
}
```

### UI Component Inventory (MVP)

| Component | Based On | Custom Behavior |
|-----------|----------|-----------------|
| GlassCard | div | Frosted background, hover lift |
| GlassButton | shadcn Button | Glass bg + gradient border on primary variant |
| GlassInput | shadcn Input | Glass bg, glow border on focus |
| GlassSidebar | custom | Fixed, frosted, icon + label nav |
| GlassModal | shadcn Dialog | Frosted overlay + glass content |
| GlassBadge | shadcn Badge | Semi-transparent colored badges |
| PromptBlock | custom | Code-block style with copy button, monospace |
| TokenCounter | custom | Animated number with coin icon |
| StatusPill | custom | Color-coded task status indicator |

---

## 10. Risks & Mitigations

### Legal / Compliance

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **AI Tool ToS Violations** — Most tools (Runway, Kling, Hailuo) prohibit systematic commercial use of free tiers. Coordinated farming is detectable. | **CRITICAL** | Position as "use tools you already have access to." Support open-source models (Wan 2.1 via Replicate, local runs). Don't require specific tools. |
| 2 | **YouTube AI Content Policy** — AI-generated content must be disclosed. May face limited monetization or demonetization. | **HIGH** | Always disclose AI-generated content. Diversify platforms (TikTok, Instagram Reels, Shorts). Don't rely solely on YouTube. |
| 3 | **Labor Law** — Paying users for tasks may classify them as contractors. Tax implications (1099 in US, TDS in India). | **HIGH** | Launch with points/tokens only (no real money). Consult a lawyer before enabling cashout. Structure as "rewards program" not employment. |
| 4 | **Copyright** — AI-generated content copyright is unsettled law (US Copyright Office says no protection for fully AI-generated works). | **MEDIUM** | Keep humans in the loop (prompts are human-authored). Document creative decisions. Don't claim copyright on AI outputs. |

### Technical

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 5 | **Video Quality Inconsistency** — Different users produce different quality clips. Models produce inconsistent styles across scenes. | **HIGH** | Enforce specific model + settings in task instructions. Style-consistent prompts. Mandatory review step. |
| 6 | **Free Tier Limits Change** — AI companies frequently modify or remove free tiers without notice. | **CRITICAL** | Model-agnostic design. Never hardcode a single provider. Support open-source alternatives. |
| 7 | **Google Drive Link Rot** — Users delete files, revoke sharing, or run out of space. | **MEDIUM** | Verify on submission + re-verify before merge. Notify users if link breaks. Consider R2 backup for approved clips (v1.5). |
| 8 | **Token Fraud** — Users submitting garbage (wrong video, black screen, stolen content) to farm tokens. | **HIGH** | Mandatory review. Progressive trust levels. Rate limiting (max tasks per day). AI-assisted content validation (v2). |
| 9 | **Supabase Free Tier Limits** — 500MB DB, pauses after 1 week inactivity. | **LOW** | Keep a cron ping to prevent pausing. 500MB is enough for thousands of rows. Upgrade to Pro ($25) when needed. |

### Business

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 10 | **Unit Economics** — YouTube CPM for AI content is $1–4/1K views. A video earning $10 needs 3K+ views. If 5 workers are paid $0.50 each ($2.50), you need reliable 1K+ views. | **CRITICAL** | Don't promise real money at launch. Validate revenue per video before enabling payouts. Multiple revenue streams (sponsors, licensing). |
| 11 | **Cold Start Problem** — Need both projects AND workers simultaneously. Neither side has value without the other. | **HIGH** | Seed with your own projects. Build community first (Discord, Twitter). Gamification (leaderboard, badges) drives early retention without payouts. |
| 12 | **Review Bottleneck** — You are the only reviewer in v1. At 100+ submissions/day, this is unsustainable. | **MEDIUM** | Peer review system (v2). Trusted users can review. AI-assisted pre-screening (check resolution, duration, content). |

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1) — COMPLETE

```
Day 1-2: Project Setup                              DONE
├── Next.js 16 scaffold with TypeScript              ✓
├── Tailwind CSS v4 configuration                    ✓
├── Supabase project setup (DB + Auth)               ✓
├── Drizzle ORM config + initial schema migration    ✓
├── Environment variables (.env.local)               ✓
├── Custom glassmorphism components (not shadcn)      ✓ (changed from plan)
├── Supabase auth middleware (middleware.ts)          ✓
└── Google OAuth flow (login → callback → profile)   ✓

Day 3-4: Design System                              DONE
├── Glassmorphism CSS tokens (globals.css)           ✓
├── GlassCard, Badge, StatCard components            ✓
├── Sidebar + Topbar + PageShell + EmptyState        ✓
├── Animated mesh gradient background                ✓
├── Dashboard layout (sidebar + header + content)    ✓
└── Dark theme setup                                 ✓

Day 5: Landing Page                                  DONE
├── Hero section (animated glass card, headline, CTA)✓
├── How It Works section (3-step visual)             ✓
├── Features grid                                    ✓
└── Footer with links                                ✓
```

### Phase 2: Core Task Loop (Week 2) — COMPLETE

```
Day 1: Projects                                      DONE
├── Admin: Create project form (scene builder)       ✓
├── Admin: POST /api/projects (create + tasks)       ✓
├── Public: Project listing (real data, filters)     ✓
└── Public: Project detail (task list, status badges)✓

Day 2-3: Tasks                                       DONE
├── Task card component (status, prompt, reward)     ✓
├── Claim task flow (POST /api/tasks/[id]/claim)     ✓
├── Task detail page (full lifecycle):               ✓
│   ├── Prompt display + copy-to-clipboard           ✓
│   ├── Step-by-step instructions                    ✓
│   ├── AI tool suggestions                          ✓
│   ├── Google Drive link input + real verification  ✓
│   └── Submit flow (POST /api/tasks/[id]/submit)    ✓
├── My Tasks page (real data from Supabase)          ✓
└── Task expiry logic (24h set on claim)             ✓ (enforcement pending)

Day 4: Drive Verification                            DONE
├── Google Drive API key setup                       ✓
├── Drive link URL parser (extract file ID)          ✓
├── POST /api/drive/verify endpoint                  ✓
├── Verification status UI (loading → success → err) ✓
└── Error handling (not accessible, wrong format)    ✓

Day 5: Review System                                 DONE
├── Admin review page (real pending submissions)     ✓
├── Review UI: Drive link, metadata, approve/reject  ✓
├── Approve flow: update task, credit tokens         ✓
├── Reject flow: add notes, notify user              ✓
└── Notification created on approve/reject           ✓
```

### Phase 3: Economy & Polish (Week 3) — MOSTLY COMPLETE

```
Day 1: Token System                                  DONE
├── Token ledger functions (credit, getBalance)      ✓
├── Atomic balance updates (transaction + profile)   ✓
├── Wallet page (current balance, lifetime earned)   ✓
└── Transaction history list                         ✓

Day 2: Leaderboard & Gamification                    DONE
├── Leaderboard page (top earners, ranked table)     ✓
├── Profile page (public stats, task history)        ✓
├── Trust level display (badge/icon per level)       ✓
└── Auto trust level upgrade on milestones           ✗ NOT DONE

Day 3: Notifications                                 PARTIAL
├── Notification creation on key events              ✓ (server-side)
├── Notification dropdown in header                  ✗ NOT DONE
├── Mark as read functionality                       ✓ (query exists)
└── Notification page                                ✗ NOT DONE

Day 4-5: Polish                                      PARTIAL
├── Responsive design (mobile, tablet, desktop)      ✓
├── Framer Motion page transitions                   ✓
├── Loading skeletons (glass shimmer effect)         ✓
├── Error boundaries and error pages                 ✓ (404 only)
├── Empty states (no projects, no tasks, etc.)       ✓
├── SEO meta tags + OpenGraph image                  ✗ NOT DONE
├── Performance audit (Lighthouse)                   ✗ NOT DONE
└── Bug fixes and edge cases                         ONGOING
```

### Phase 4: Post-MVP (Week 4+) — NOT STARTED

```
v1.1: Video Merge Automation
├── Fly.io worker setup
├── FFmpeg merge pipeline (download → normalize → concat → transitions)
├── Job queue (Upstash BullMQ)
├── Merge status tracking in video_outputs table
└── Admin trigger: "Merge all approved clips"

v1.2: YouTube Integration
├── YouTube Data API v3 OAuth setup
├── Upload merged video to YouTube
├── Auto-set title, description, tags, thumbnail
├── Revenue tracking (YouTube Analytics API)
└── Revenue sync cron job

v1.5: Token Redemption
├── Redemption request form (amount, payment method)
├── Admin approval flow for payouts
├── Payment integration (UPI for India, PayPal global)
├── Exchange rate configuration
└── Tax compliance considerations

v2.0: User-Created Campaigns
├── Campaign creation flow (budget, instructions, task template)
├── Escrow system (lock tokens on campaign creation)
├── Campaign discovery marketplace
├── Campaign analytics for creators
└── Dispute resolution system
```

---

## 12. Key Decisions Log

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Video storage | Google Drive (user's own) | Zero cost. 15GB per user. Platform stores only URLs. |
| 2 | Auth provider | Supabase Auth (Google OAuth) | Users need Google accounts for Drive anyway. No redundant auth layer. |
| 3 | Money at launch | Points/tokens only, no cashout | No revenue yet. Legal protection. Enable redemption later. |
| 4 | First project type | Video pipeline | This is the unique value prop. Don't generalize prematurely. |
| 5 | User campaigns | Not in v1 | Need supply (workers) before building demand tools (campaign creation). |
| 6 | Video merge in v1 | Manual (CapCut/DaVinci) | Don't automate what you do 5 times. Build FFmpeg worker at 50+ projects. |
| 7 | Admin panel | Built into the app | You're the only admin at launch. No separate admin app needed. |
| 8 | File uploads | None in v1 | Drive links only. No S3/R2 needed. Eliminates biggest cost. |
| 9 | Target audience | India-first, global-ready | Student demographic + free-tier usage skews India/SE Asia. UI in English. |
| 10 | ORM | Drizzle (not Prisma) | Lighter, faster, better SQL control. Prisma is bloated for this scale. |

---

## Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Supabase PostgreSQL direct connection)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Google
GOOGLE_DRIVE_API_KEY=AIza...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USER_IDS=uuid1,uuid2

# Upstash Redis (when needed)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Quick Start Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest Task Turkey --typescript --tailwind --eslint --app --src-dir

# 2. Install core dependencies
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres
npm install -D drizzle-kit

# 3. Install UI dependencies
npx shadcn@latest init
npm install framer-motion
npm install clsx tailwind-merge
npm install lucide-react

# 4. Install utility dependencies
npm install zod                     # API validation
npm install date-fns                # Date formatting
npm install sonner                  # Toast notifications

# 5. Setup Supabase CLI (local development)
npx supabase init
npx supabase start

# 6. Run Drizzle migration
npx drizzle-kit push

# 7. Start dev server
npm run dev
```

---

*Last updated: 2026-03-02*
*Status: MVP functionally complete. All pages wired to real data. Ready for polish + deploy.*
