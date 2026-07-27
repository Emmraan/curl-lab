/**
 * CurlLab Local Agent Companion
 * 
 * Instructions:
 * 1. Ensure you have Node.js (version 18+) installed.
 * 2. Create a folder, and install 'ws' package:
 *    npm install ws
 * 3. Save this file as 'agent.js' in that folder.
 * 4. Run the agent pointing to your hosted CurlLab app:
 *    node agent.js --url wss://your-app-url.run.app
 */

const WebSocket = require("ws");

// Parse arguments
const args = process.argv.slice(2);
let serverUrl = "";

for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--url" || args[i] === "-u") && i + 1 < args.length) {
    serverUrl = args[i + 1];
    break;
  }
}

// Fallback to local default if no URL is provided
if (!serverUrl) {
  serverUrl = "ws://localhost:3000";
}

// If user provided an http/https URL, convert to ws/wss
if (serverUrl.startsWith("http://")) {
  serverUrl = serverUrl.replace("http://", "ws://");
} else if (serverUrl.startsWith("https://")) {
  serverUrl = serverUrl.replace("https://", "wss://");
}

// Append the WebSocket endpoint if not present
if (!serverUrl.endsWith("/api/ws")) {
  // Remove trailing slash if present
  serverUrl = serverUrl.replace(/\/$/, "") + "/api/ws";
}

console.log("=========================================");
console.log("🧪 CurlLab Local Agent Companion");
console.log(`📡 Connecting to: ${serverUrl}`);
console.log("=========================================\n");

let ws;
let reconnectTimeout;

function connect() {
  ws = new WebSocket(serverUrl);

  ws.on("open", () => {
    console.log("✅ Successfully connected to CurlLab Server!");
    console.log("🟢 Listening for local requests from CurlLab browser...\n");
  });

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === "execute" && data.requestId) {
        const { method, url, headers, body, multipart, timeout } = data.payload;
        console.log(`⚡ [Request] ${method} -> ${url}`);

        const result = await executeLocalRequest({ method, url, headers, body, multipart, timeout });
        
        // Send the response back
        ws.send(JSON.stringify({
          type: "response",
          requestId: data.requestId,
          payload: result
        }));
        
        console.log(`✔ [Response] Status: ${result.status} | Size: ${result.size} bytes | Time: ${result.time}ms\n`);
      }
    } catch (err) {
      console.error("❌ Error processing request:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("⚠️ Disconnected from CurlLab Server. Reconnecting in 5 seconds...");
    cleanup();
    reconnectTimeout = setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ Socket error:", err.message);
    ws.close();
  });
}

function cleanup() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
}

/**
 * Executes an HTTP request locally using native fetch.
 * Does NOT run actual shell commands or curl executables.
 */
async function executeLocalRequest({ method, url, headers, body, multipart, timeout = 30000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestHeaders = { ...headers };
  // Let fetch handle Host and content length
  delete requestHeaders["host"];
  delete requestHeaders["content-length"];

  let requestBody = body;

  // Handle multipart form-data
  if (multipart && multipart.length > 0) {
    const formData = new FormData();
    multipart.forEach(({ key, value }) => {
      formData.append(key, value);
    });
    delete requestHeaders["content-type"];
    requestBody = formData;
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== "GET" && method !== "HEAD" ? requestBody : undefined,
      signal: controller.signal,
    });

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    const responseText = await response.text();
    const responseHeaders = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const statusLine = `HTTP/1.1 ${response.status} ${response.statusText}\r\n`;
    const headersSection = Object.entries(responseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n");
    const rawResponse = `${statusLine}${headersSection}\r\n\r\n${responseText}`;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      size: Buffer.byteLength(responseText, "utf8"),
      time: elapsedTime,
      rawResponse,
    };
  } catch (err) {
    const endTime = Date.now();
    return {
      status: 0,
      statusText: "Agent Request Error",
      headers: {},
      body: `Local Agent failed to execute request: ${err.message}`,
      size: 0,
      time: endTime - startTime,
      rawResponse: `HTTP/1.1 0 Error\r\n\r\nLocal Agent Error: ${err.message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

connect();
