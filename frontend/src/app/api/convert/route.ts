import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UPSTREAM_URL = process.env.BANK_API_URL ?? "http://127.0.0.1:8080/api/convert";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bankType = formData.get("bankType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }
    if (typeof bankType !== "string" || !bankType.trim()) {
      return NextResponse.json({ error: "Missing bankType." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const upstreamForm = new FormData();
    upstreamForm.append("file", new Blob([buffer], { type: file.type || "application/pdf" }), file.name);
    upstreamForm.append("bankType", bankType);

    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      body: upstreamForm,
    });

    const contentType = upstreamResponse.headers.get("content-type") ?? "application/json";
    const body = await upstreamResponse.text();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
