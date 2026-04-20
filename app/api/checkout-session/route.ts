import { NextResponse } from "next/server";
import {
  CHECKOUT_COOKIE_NAME,
  CHECKOUT_TTL_SECONDS,
  defaultCookieSecurity,
  generateCheckoutSessionToken
} from "@/lib/auth";

export async function POST() {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Checkout is not configured. Set NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID in your environment."
      },
      { status: 500 }
    );
  }

  const sessionToken = generateCheckoutSessionToken();

  const params = new URLSearchParams({
    embed: "1",
    media: "0",
    logo: "0",
    dark: "1"
  });

  params.set("checkout[custom][session_token]", sessionToken);
  params.set("checkout[custom][origin]", "supabase-db-visualizer");

  const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/${productId}?${params.toString()}`;

  const response = NextResponse.json({
    ok: true,
    sessionToken,
    checkoutUrl
  });

  response.cookies.set({
    ...defaultCookieSecurity(),
    name: CHECKOUT_COOKIE_NAME,
    value: sessionToken,
    maxAge: CHECKOUT_TTL_SECONDS
  });

  return response;
}
