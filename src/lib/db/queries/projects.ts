import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";

export async function listProjects() {
    return db.select().from(projects).where(eq(projects.status, "active"));
}

/** Returns projects with totalTasks and openTasks counts */
export async function listProjectsWithCounts() {
    return db
        .select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            styleGuide: projects.styleGuide,
            resolution: projects.resolution,
            aspectRatio: projects.aspectRatio,
            clipDurationS: projects.clipDurationS,
            suggestedModels: projects.suggestedModels,
            rewardPerTask: projects.rewardPerTask,
            deadline: projects.deadline,
            status: projects.status,
            createdAt: projects.createdAt,
            totalTasks: count(tasks.id).as("total_tasks"),
            openTasks: sql<number>`count(case when ${tasks.status} = 'open' then 1 end)`.as("open_tasks"),
        })
        .from(projects)
        .leftJoin(tasks, eq(tasks.projectId, projects.id))
        .where(eq(projects.status, "active"))
        .groupBy(projects.id)
        .orderBy(projects.createdAt);
}

/** Returns single project by ID with all its tasks */
export async function getProjectWithTasks(id: string) {
    const project = await getProject(id);
    if (!project) return null;
    const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(tasks.sceneNumber);
    return { ...project, tasks: projectTasks };
}

export async function getProject(id: string) {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ?? null;
}

export async function createProject(
    data: typeof projects.$inferInsert,
    scenes: { sceneNumber: number; title: string; prompt: string }[]
) {
    return db.transaction(async (tx) => {
        const [project] = await tx.insert(projects).values(data).returning();
        if (scenes.length > 0) {
            await tx.insert(tasks).values(
                scenes.map((s) => ({
                    projectId: project.id,
                    sceneNumber: s.sceneNumber,
                    title: s.title,
                    prompt: s.prompt,
                }))
            );
        }
        return project;
    });
}
