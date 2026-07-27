const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const port = 3000;

// Initialize Next.js app
const app = next({ dev, port });
const handle = app.getRequestHandler();

// Define globals for cross-process communication between HTTP API routes and WebSocket
global.activeAgentSocket = null;
global.pendingRequests = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrades on port 3000
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);

    if (pathname === "/api/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      // Normal Next.js upgrades (e.g. Next.js dev websocket if any) are bypassed
      // but since HMR is disabled, we don't have to worry about them.
    }
  });

  // WebSocket connection lifecycle
  wss.on("connection", (ws, req) => {
    console.log("Local Agent connected to CurlLab WebSocket");
    
    // Set active socket
    global.activeAgentSocket = ws;

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === "pong") {
          return;
        }

        // Receive response from agent
        if (data.type === "response" && data.requestId) {
          const resolver = global.pendingRequests.get(data.requestId);
          if (resolver) {
            resolver(data.payload);
            global.pendingRequests.delete(data.requestId);
          }
        }
      } catch (err) {
        console.error("Error parsing agent message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Local Agent disconnected");
      if (global.activeAgentSocket === ws) {
        global.activeAgentSocket = null;
      }
    });

    ws.on("error", (err) => {
      console.error("Agent socket error:", err);
      if (global.activeAgentSocket === ws) {
        global.activeAgentSocket = null;
      }
    });
  });

  server.listen(port, () => {
    console.log(`> CurlLab App & WebSocket Server running on http://localhost:${port}`);
  });
});
