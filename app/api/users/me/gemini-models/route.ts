import { NextResponse } from "next/server";
import { backendFetch } from "@/app/lib/backend";

export async function GET() {
  const backendRes = await backendFetch("/api/users/me/gemini-models");

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: backendRes.status }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}
