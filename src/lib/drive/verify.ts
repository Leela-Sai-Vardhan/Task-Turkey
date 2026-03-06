export interface DriveVerifyResult {
    valid: boolean;
    fileId?: string;
    fileName?: string;
    fileSizeMb?: number;
    mimeType?: string;
    error?: string;
}

function extractFileId(url: string): string | null {
    // Handles formats:
    //   drive.google.com/file/d/{id}/view
    //   drive.google.com/open?id={id}
    //   docs.google.com/...?id={id}
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
        /[?&]id=([a-zA-Z0-9_-]{25,})/,
    ];
    for (const re of patterns) {
        const m = url.match(re);
        if (m) return m[1];
    }
    return null;
}

export async function verifyDriveLink(url: string): Promise<DriveVerifyResult> {
    const fileId = extractFileId(url);
    if (!fileId) {
        return { valid: false, error: "Could not extract file ID from the URL." };
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
        return { valid: false, error: "Drive verification is not configured on this server." };
    }

    try {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType&key=${apiKey}`
        );

        if (!res.ok) {
            return {
                valid: false,
                error: res.status === 404
                    ? "File not found — check sharing settings."
                    : `Drive API error: ${res.status}`,
            };
        }

        const data = (await res.json()) as {
            name: string;
            size: string;
            mimeType: string;
        };

        if (!data.mimeType?.startsWith("video/")) {
            return { valid: false, error: `Expected a video file, got ${data.mimeType}.` };
        }

        const fileSizeMb = parseInt(data.size ?? "0", 10) / (1024 * 1024);
        if (fileSizeMb < 1) {
            return { valid: false, error: "File is too small (< 1 MB). Did you upload the right clip?" };
        }
        if (fileSizeMb > 500) {
            return { valid: false, error: "File is too large (> 500 MB). Please compress the video." };
        }

        return {
            valid: true,
            fileId,
            fileName: data.name,
            fileSizeMb: Math.round(fileSizeMb * 10) / 10,
            mimeType: data.mimeType,
        };
    } catch {
        return { valid: false, error: "Network error while verifying Drive link." };
    }
}
