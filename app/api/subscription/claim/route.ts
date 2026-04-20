import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { applyPaidAccessCookie } from "@/lib/auth";
import { isCheckoutSessionPaid } from "@/lib/subscription";

const claimPayloadSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = claimPayloadSchema.parse(await request.json());

    if (!isCheckoutSessionPaid(payload.sessionId)) {
      return NextResponse.json(
        {
          error: "Session is not marked as paid yet.",
        },
        { status: 402 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Access unlocked.",
    });

    applyPaidAccessCookie(response, payload.sessionId);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid claim payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to claim access.",
      },
      { status: 400 },
    );
  }
}
