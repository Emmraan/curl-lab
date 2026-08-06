/**
 * Pure, browser-safe network helpers (no Node imports).
 * Shared by server-side SSRF checks and client-side localhost routing.
 */

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
 * Best-effort detection of local/private targets usable in the browser
 * (where DNS resolution is unavailable). Covers loopback, private IP
 * literals, and common LAN hostname suffixes.
 */
export function isPrivateHostname(urlStr: string): boolean {
  try {
    if (isLocalhost(urlStr)) return true;

    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // .local / .internal hostnames are typically on the LAN
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return true;

    return isPrivateIp(hostname.replace(/^\[|\]$/g, ""));
  } catch {
    return false;
  }
}
