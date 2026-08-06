import { NextRequest, NextResponse } from "next/server";
import { parseCurl } from "@/lib/parser";
import { executeHttpRequest, isLocalhost, validateUrlForSsrf } from "@/lib/executor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { curl, parsedRequest } = body;

    // If a raw curl is provided, parse it
    if (curl && !parsedRequest) {
      parsedRequest = parseCurl(curl);
    }

    if (!parsedRequest || !parsedRequest.url) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. A valid URL or cURL is required." },
        { status: 400 }
      );
    }

    const targetUrl = parsedRequest.url;

    // Localhost/private targets run directly in the browser (browser-direct mode),
    // so they should never reach this server endpoint. Guard just in case.
    if (isLocalhost(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This request targets localhost, which is executed directly in your browser. If you see this error, refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    // Public IP Request: Run on the server
    // Validate for SSRF
    const ssrfCheck = await validateUrlForSsrf(targetUrl);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    // Execute
    const response = await executeHttpRequest({
      method: parsedRequest.method,
      url: targetUrl,
      headers: parsedRequest.headers,
      body: parsedRequest.body,
      multipart: parsedRequest.multipart,
      timeout: parsedRequest.timeout,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute request" },
      { status: 500 }
    );
  }
}
