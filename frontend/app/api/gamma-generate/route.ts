import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputText = String(body?.inputText || "").trim();
    const textMode = String(body?.textMode || "generate");
    const format = String(body?.format || "presentation");

    if (!inputText) {
      return NextResponse.json({ error: "inputText is required" }, { status: 400 });
    }

    const apiKey = process.env.GAMMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gamma API key not configured" }, { status: 500 });
    }

    const payload: any = {
      inputText,
      textMode,
      format,
      // Forward optional fields (hardcoded by caller except inputText/numCards)
      themeId: body?.themeName,
      numCards: body?.numCards,
      cardSplit: body?.cardSplit,
      additionalInstructions: body?.additionalInstructions,
      exportAs: body?.exportAs,
      textOptions: body?.textOptions,
      imageOptions: body?.imageOptions,
      cardOptions: body?.cardOptions,
      sharingOptions: body?.sharingOptions,
    };

    const res = await fetch(`${API_ENDPOINTS.GAMMA_API_GENERATION_API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Gamma generation failed" }, { status: res.status });
    }

    return NextResponse.json({ generationId: data?.generationId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}



