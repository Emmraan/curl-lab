import { NextRequest, NextResponse } from "next/server";
import { parseCurl } from "@/lib/parser";
import { executeHttpRequest, isLocalhost, validateUrlForSsrf } from "@/lib/executor";
import crypto from "crypto";

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

    // 1. Localhost Detection
    if (isLocalhost(targetUrl)) {
      // Check if we have an active agent connection
      const agentWs = (global as any).activeAgentSocket;
      const pendingReqs = (global as any).pendingRequests;

      if (!agentWs) {
        return NextResponse.json(
          {
            success: false,
            error: "This request targets localhost. Please start the Local Agent.",
          },
          { status: 400 }
        );
      }

      const requestId = crypto.randomUUID();

      // Create a promise that resolves when the agent returns the response
      const executionPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (pendingReqs.has(requestId)) {
            pendingReqs.delete(requestId);
            reject(new Error("Local Agent execution timed out after 35 seconds."));
          }
        }, 35000);

        pendingReqs.set(requestId, (responsePayload: any) => {
          clearTimeout(timeoutId);
          resolve(responsePayload);
        });
      });

      // Send the execution job to the Local Agent
      agentWs.send(
        JSON.stringify({
          type: "execute",
          requestId,
          payload: parsedRequest,
        })
      );

      // Wait for the agent to execute and return the response
      const agentResult = await executionPromise as any;
      
      return NextResponse.json({
        success: true,
        response: agentResult,
      });
    }

    // 2. Public IP Request: Run on the server
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
