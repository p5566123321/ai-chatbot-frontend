import { NextResponse } from "next/server";

export async function POST() {
  const backendBaseUrl =
    process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

  const backendRes = await fetch(`${backendBaseUrl}/api/conversations`, {
    method: "POST",
  });

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: 502 }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data, { status: 201 });
}
