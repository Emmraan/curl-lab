import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const isConnected = !!(global as any).activeAgentSocket;
  return NextResponse.json({
    connected: isConnected,
  });
}
