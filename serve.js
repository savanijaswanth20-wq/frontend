/**
 * Lightweight local development server for JobNex (Zero Dependencies)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, "frontend");
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  if (pathname === "/" || pathname === "/index.html") {
    pathname = "/index.html";
  }

  // Remove leading /frontend/ if present in request
  if (pathname.startsWith("/frontend/")) {
    pathname = pathname.replace(/^\/frontend/, "");
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(FRONTEND_DIR, safePath);

  // Check file existence or try appending .html / look inside pages/
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(filePath + ".html")) {
      filePath += ".html";
    } else if (fs.existsSync(path.join(FRONTEND_DIR, "pages", safePath + ".html"))) {
      filePath = path.join(FRONTEND_DIR, "pages", safePath + ".html");
    } else if (fs.existsSync(path.join(filePath, "index.html"))) {
      filePath = path.join(filePath, "index.html");
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h2>404 - Page Not Found</h2>
          <p>Requested path: <code>${pathname}</code></p>
          <a href="/" style="color: #818cf8;">Return to Home</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 JobNex Local Dev Server Running!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`📁 Serving: ${FRONTEND_DIR}`);
  console.log(`======================================================\n`);
});
