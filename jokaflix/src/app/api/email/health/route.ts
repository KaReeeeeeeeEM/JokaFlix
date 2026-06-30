import { NextResponse } from "next/server";
import { verifyEmailTransport } from "../../../../lib/email";

export async function POST() {
  try {
    await verifyEmailTransport();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[JokaFlix email] SMTP health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Email delivery is not available right now. Check the Gmail app password configuration.",
      },
      { status: 503 }
    );
  }
}
