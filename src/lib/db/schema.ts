import { sql } from "drizzle-orm";
import {
    pgTable,
    pgEnum,
    uuid,
    text,
    integer,
    numeric,
    boolean,
    timestamp,
    date,
    index,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────
export const projectStatusEnum = pgEnum("project_status", [
    "draft", "active", "paused", "completed",
]);

export const taskStatusEnum = pgEnum("task_status", [
    "open", "assigned", "submitted", "pending_review",
    "approved", "rejected", "expired",
]);

export const videoStatusEnum = pgEnum("video_status", [
    "pending", "approved", "rejected",
]);

export const tokenTxTypeEnum = pgEnum("token_tx_type", [
    "task_reward", "bonus", "deduction", "withdrawal_request",
]);

// ── Profiles ──────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey(),
    username: text("username").unique().notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").default(""),
    avatarUrl: text("avatar_url"),
    trustLevel: integer("trust_level").notNull().default(1),
    tokenBalance: integer("token_balance").notNull().default(0),
    tasksCompleted: integer("tasks_completed").notNull().default(0),
    approvalRate: numeric("approval_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    memberSince: timestamp("member_since", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Projects ──────────────────────────────────────────────────
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").default(""),
    styleGuide: text("style_guide").default(""),
    resolution: text("resolution").notNull().default("1080p"),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"),
    clipDurationS: integer("clip_duration_s").notNull().default(10),
    suggestedModels: text("suggested_models").array().default(sql`'{}'::text[]`),
    rewardPerTask: integer("reward_per_task").notNull().default(50),
    deadline: date("deadline"),
    status: projectStatusEnum("status").notNull().default("active"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Tasks ─────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    sceneNumber: integer("scene_number").notNull(),
    title: text("title").notNull().default(""),
    prompt: text("prompt").notNull(),
    status: taskStatusEnum("status").notNull().default("open"),
    assignedTo: uuid("assigned_to").references(() => profiles.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    index("tasks_project_id_idx").on(t.projectId),
    index("tasks_assigned_to_idx").on(t.assignedTo),
    index("tasks_status_idx").on(t.status),
]);

// ── Video Outputs (submissions) ───────────────────────────────
export const videoOutputs = pgTable("video_outputs", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    driveUrl: text("drive_url").notNull(),
    driveFileId: text("drive_file_id"),
    fileName: text("file_name"),
    fileSizeMb: numeric("file_size_mb", { precision: 10, scale: 2 }),
    mimeType: text("mime_type"),
    status: videoStatusEnum("status").notNull().default("pending"),
    reviewerNote: text("reviewer_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

// ── Token Transactions ────────────────────────────────────────
export const tokenTransactions = pgTable("token_transactions", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: tokenTxTypeEnum("type").notNull(),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    index("token_tx_user_id_idx").on(t.userId),
]);

// ── Notifications ─────────────────────────────────────────────
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    index("notifications_user_idx").on(t.userId, t.read),
]);

// ── Inferred Types ────────────────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type VideoOutput = typeof videoOutputs.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
