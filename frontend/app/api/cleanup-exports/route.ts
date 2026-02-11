import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..");
    const exportsDir = path.join(projectRoot, "exports");
    const tempDir = path.join(exportsDir, "temp");

    await fs.rm(exportsDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}
