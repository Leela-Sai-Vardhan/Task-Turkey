import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listProjectsWithCounts, createProject } from "@/lib/db/queries/projects";

function isAdmin(userId: string): boolean {
    const adminIds = (process.env.ADMIN_USER_IDS ?? "")
        .split(",").map((s) => s.trim()).filter(Boolean);
    return adminIds.includes(userId);
}

export async function GET() {
    const projects = await listProjectsWithCounts();
    return NextResponse.json(projects);
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !isAdmin(user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
        title: string;
        description?: string;
        styleGuide?: string;
        resolution?: string;
        aspectRatio?: string;
        clipDurationS?: number;
        suggestedModels?: string[];
        rewardPerTask: number;
        deadline?: string;
        scenes: { sceneNumber: number; title: string; prompt: string }[];
    };

    const project = await createProject(
        {
            title: body.title,
            description: body.description,
            styleGuide: body.styleGuide,
            resolution: body.resolution ?? "1080p",
            aspectRatio: body.aspectRatio ?? "16:9",
            clipDurationS: body.clipDurationS ?? 10,
            suggestedModels: body.suggestedModels,
            rewardPerTask: body.rewardPerTask,
            deadline: body.deadline,
            createdBy: user.id,
        },
        body.scenes ?? []
    );

    return NextResponse.json({ project }, { status: 201 });
}
