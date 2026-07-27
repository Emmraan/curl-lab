import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

export interface ExecutionResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number; // in bytes
  time: number; // in milliseconds
  rawResponse: string;
}

/**
 * Checks if an IP is in a private/loopback/link-local range.
 */
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true; // Block invalid

    // Loopback: 127.0.0.0/8
    if (parts[0] === 127) return true;
    // Private: 10.0.0.0/8
    if (parts[0] === 10) return true;
    // Private: 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // Private: 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // Link-local: 169.254.0.0/16 (Metadata endpoints)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // Broadcast/Anycast: 0.0.0.0
    if (parts[0] === 0) return true;

    return false;
  }

  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    // Loopback
    if (normalized === "::1" || normalized === "::") return true;
    // Unique local (ULA) or link-local
    if (normalized.startsWith("fe80:") || normalized.startsWith("fc00:") || normalized.startsWith("fd00:")) return true;
    return false;
  }

  return true; // Block unknown formats
}

/**
 * Detects if a URL target is localhost or equivalent loopback addresses.
 */
export function isLocalhost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0" ||
      hostname === "::"
    );
  } catch {
    return false;
  }
}

/**
 * Prevents SSRF attacks by resolving hostname and verifying it does not resolve to a private IP.
 */
export async function validateUrlForSsrf(urlStr: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname;

    // If it's already localhost, we skip the SSRF block because the client will detect it
    // and prompt for/use the local agent instead.
    if (isLocalhost(urlStr)) {
      return { valid: true };
    }

    // Resolve hostname to IP
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) {
      return {
        valid: false,
        error: `SSRF Blocked: The host resolved to private IP (${address}). Server execution is forbidden.`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `Invalid or unresolvable URL: ${err.message}` };
  }
}

/**
 * Executes an HTTP request on the server side using native fetch.
 * Strictly enforces timeout, response size limits (5MB max), and SSRF validation.
 */
export async function executeHttpRequest(params: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  multipart?: Array<{ key: string; value: string }>;
  timeout?: number;
}): Promise<ExecutionResponse> {
  const { method, url, headers, body, multipart, timeout = 30000 } = params;

  // 1. SSRF check
  const ssrfCheck = await validateUrlForSsrf(url);
  if (!ssrfCheck.valid) {
    throw new Error(ssrfCheck.error || "SSRF validation failed");
  }

  // 2. Timeout Cap
  const maxTimeout = Math.min(timeout, 60000); // Max 60 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), maxTimeout);

  // 3. Prepare headers & body
  const requestHeaders = { ...headers };
  
  // Clean headers (sanitize)
  // Remove Host header or other system restricted headers to let fetch handle it
  delete requestHeaders["host"];
  delete requestHeaders["content-length"];

  let requestBody: any = body;

  // Handle multipart form-data if specified
  if (multipart && multipart.length > 0) {
    const formData = new FormData();
    multipart.forEach(({ key, value }) => {
      formData.append(key, value);
    });
    // Let browser/fetch set boundary automatically
    delete requestHeaders["content-type"];
    requestBody = formData;
  }

  const startTime = Date.now();
  try {
    const fetchResponse = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== "GET" && method !== "HEAD" ? requestBody : undefined,
      signal: controller.signal,
    });

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // 4. Read response with a size limit (5MB max)
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const reader = fetchResponse.body?.getReader();
    
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (receivedLength > MAX_BYTES) {
          controller.abort();
          throw new Error(`Response size limit exceeded (max 5MB)`);
        }
      }
    }

    const fullBuffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      fullBuffer.set(chunk, position);
      position += chunk.length;
    }

    const responseText = new TextDecoder().decode(fullBuffer);

    // Extract headers
    const responseHeaders: Record<string, string> = {};
    fetchResponse.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    // Reconstruct raw HTTP response text
    const statusLine = `HTTP/1.1 ${fetchResponse.status} ${fetchResponse.statusText}\r\n`;
    const headersSection = Object.entries(responseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n");
    const rawResponse = `${statusLine}${headersSection}\r\n\r\n${responseText}`;

    return {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: responseHeaders,
      body: responseText,
      size: receivedLength,
      time: elapsedTime,
      rawResponse,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
