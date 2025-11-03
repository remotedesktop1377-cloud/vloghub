import { NextRequest, NextResponse } from "next/server";

let API_IN_PROGRESS = false;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const generationId = params?.id;
    if (!generationId) {
      return NextResponse.json({ error: "generationId is required" }, { status: 400 });
    }
    if (API_IN_PROGRESS) {
      return NextResponse.json({ error: "Gamma API is already in progress" }, { status: 400 });
    }
    API_IN_PROGRESS = true;

    const apiKey = process.env.GAMMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gamma API key not configured" }, { status: 500 });
    }

    const url = `https://public-api.gamma.app/v0.2/generations/${encodeURIComponent(generationId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    });

    API_IN_PROGRESS = false;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Gamma status fetch failed" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    API_IN_PROGRESS = false;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}



