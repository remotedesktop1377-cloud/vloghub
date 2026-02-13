import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import os from "os";

export const runtime = "nodejs";

export async function POST() {
  try {
    const projectRoot = os.tmpdir();
    const exportsDir = path.join(projectRoot, "exports");
    await fs.rm(exportsDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}
