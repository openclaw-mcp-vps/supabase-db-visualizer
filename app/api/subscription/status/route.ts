import { NextResponse } from "next/server";

import { getCheckoutSession } from "@/lib/subscription";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");

  if (!sessionId) {
    return NextResponse.json(
      {
        error: "Missing session query parameter.",
      },
      { status: 400 },
    );
  }

  const session = getCheckoutSession(sessionId);

  return NextResponse.json({
    sessionId,
    exists: Boolean(session),
    paid: session?.status === "paid",
    createdAt: session ? new Date(session.createdAt).toISOString() : null,
    paidAt: session?.paidAt ? new Date(session.paidAt).toISOString() : null,
  });
}
