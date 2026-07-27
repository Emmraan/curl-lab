import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("curllab_session")?.value;

  if (!cookie) {
    return NextResponse.json({ authenticated: false });
  }

  const session = verifySessionToken(cookie);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    username: session.username,
  });
}
