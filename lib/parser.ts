export interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  multipart: Array<{ key: string; value: string }>;
  cookies: string;
  timeout: number; // in milliseconds
  compressed: boolean;
}

/**
 * Tokenizes a command line string into separate arguments, respecting single/double quotes,
 * backslashes, and whitespace.
 */
export function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let currentToken = "";
  let insideSingleQuotes = false;
  let insideDoubleQuotes = false;
  let escapeNext = false;

  // Clean up multiline backslashes
  const cleanCommand = command.replace(/\\\s*\n/g, " ");

  for (let i = 0; i < cleanCommand.length; i++) {
    const char = cleanCommand[i];

    if (escapeNext) {
      currentToken += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      if (insideSingleQuotes) {
        currentToken += char;
      } else {
        escapeNext = true;
      }
      continue;
    }

    if (char === "'" && !insideDoubleQuotes) {
      insideSingleQuotes = !insideSingleQuotes;
      continue;
    }

    if (char === '"' && !insideSingleQuotes) {
      insideDoubleQuotes = !insideDoubleQuotes;
      continue;
    }

    if (
      (char === " " || char === "\t" || char === "\n" || char === "\r") &&
      !insideSingleQuotes &&
      !insideDoubleQuotes
    ) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

/**
 * Parses a cURL command into a structured HTTP request configuration.
 */
export function parseCurl(curlString: string): ParsedRequest {
  const tokens = tokenize(curlString.trim());
  
  const headers: Record<string, string> = {};
  const multipart: Array<{ key: string; value: string }> = [];
  let method = "";
  let url = "";
  let body = "";
  let cookies = "";
  let timeout = 30000; // default 30s
  let compressed = false;
  let basicAuth = "";

  // Flags that consume an argument
  const argFlags = new Set([
    "-X", "--request",
    "-H", "--header",
    "-d", "--data", "--data-raw", "--data-binary", "--data-urlencode",
    "-u", "--user",
    "-F", "--form",
    "-b", "--cookie",
    "-m", "--max-time",
    "--url"
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // If it is the executable 'curl', skip it
    if (i === 0 && (token === "curl" || token === "curl.exe")) {
      continue;
    }

    // Handle method argument
    if (token === "-X" || token === "--request") {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
      }
      continue;
    }

    // Handle headers
    if (token === "-H" || token === "--header") {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx !== -1) {
          const key = headerStr.substring(0, colonIdx).trim();
          const value = headerStr.substring(colonIdx + 1).trim();
          // Normalize header keys
          headers[key] = value;
        }
      }
      continue;
    }

    // Handle body data
    if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary" || token === "--data-urlencode") {
      if (i + 1 < tokens.length) {
        const dataVal = tokens[++i];
        if (body) {
          body += `&${dataVal}`;
        } else {
          body = dataVal;
        }
      }
      continue;
    }

    // Handle Basic Authentication
    if (token === "-u" || token === "--user") {
      if (i + 1 < tokens.length) {
        basicAuth = tokens[++i];
      }
      continue;
    }

    // Handle Cookies
    if (token === "-b" || token === "--cookie") {
      if (i + 1 < tokens.length) {
        cookies = tokens[++i];
      }
      continue;
    }

    // Handle multipart form data
    if (token === "-F" || token === "--form") {
      if (i + 1 < tokens.length) {
        const formStr = tokens[++i];
        const eqIdx = formStr.indexOf("=");
        if (eqIdx !== -1) {
          const key = formStr.substring(0, eqIdx).trim();
          const value = formStr.substring(eqIdx + 1).trim();
          multipart.push({ key, value });
        } else {
          multipart.push({ key: formStr, value: "" });
        }
      }
      continue;
    }

    // Handle timeout
    if (token === "-m" || token === "--max-time") {
      if (i + 1 < tokens.length) {
        const sec = parseFloat(tokens[++i]);
        if (!isNaN(sec)) {
          timeout = Math.round(sec * 1000);
        }
      }
      continue;
    }

    // Handle compressed requests
    if (token === "--compressed") {
      compressed = true;
      continue;
    }

    // Handle explicit URL flag
    if (token === "--url") {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
      continue;
    }

    // Positional argument (or unrecognized option/URL)
    if (!token.startsWith("-")) {
      // Check if this token was consumed as an argument to a preceding flag
      const prevToken = tokens[i - 1];
      const isConsumed = prevToken && argFlags.has(prevToken);
      
      if (!isConsumed) {
        // If not consumed, treat as URL
        url = token;
      }
    }
  }

  // Handle standard default rules
  // If we have body or multipart, default method is POST unless specified
  if (!method) {
    if (body || multipart.length > 0) {
      method = "POST";
    } else {
      method = "GET";
    }
  }

  // Inject Basic Auth Header if provided and no explicit Auth header exists
  if (basicAuth) {
    const authHeaderExists = Object.keys(headers).some(k => k.toLowerCase() === "authorization");
    if (!authHeaderExists) {
      const encoded = Buffer.from(basicAuth).toString("base64");
      headers["Authorization"] = `Basic ${encoded}`;
    }
  }

  // Inject Cookie Header if cookies are specified and no explicit Cookie header exists
  if (cookies) {
    const cookieHeaderExists = Object.keys(headers).some(k => k.toLowerCase() === "cookie");
    if (!cookieHeaderExists) {
      headers["Cookie"] = cookies;
    }
  }

  return {
    method,
    url: url || "",
    headers,
    body,
    multipart,
    cookies,
    timeout,
    compressed,
  };
}
