import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUsername = process.env.APP_USERNAME || "admin";
    const expectedPassword = process.env.APP_PASSWORD || "admin";

    if (username === expectedUsername && password === expectedPassword) {
      const token = createSessionToken(username);

      const response = NextResponse.json({ success: true, username });
      
      // Set the session cookie as HTTP-only, secure, same-site
      response.cookies.set("curllab_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}
