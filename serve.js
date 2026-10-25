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
const ROOT_DIR = __dirname;
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

  let filePath;

  // Root index.html (restored original standalone frontend)
  if (pathname === "/" || pathname === "/index.html") {
    filePath = path.join(ROOT_DIR, "index.html");
  } else if (pathname === "/frontend" || pathname === "/frontend/" || pathname === "/frontend/index.html") {
    filePath = path.join(FRONTEND_DIR, "index.html");
  } else {
    // Strip leading /frontend/ if present
    const cleanPath = pathname.replace(/^\/frontend\//, "/");
    const safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, "");

    // Check frontend first, then root
    let testPath = path.join(FRONTEND_DIR, safePath);
    if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
      filePath = testPath;
    } else if (fs.existsSync(testPath + ".html")) {
      filePath = testPath + ".html";
    } else if (fs.existsSync(path.join(FRONTEND_DIR, "pages", safePath + ".html"))) {
      filePath = path.join(FRONTEND_DIR, "pages", safePath + ".html");
    } else if (fs.existsSync(path.join(ROOT_DIR, safePath))) {
      filePath = path.join(ROOT_DIR, safePath);
    } else {
      filePath = testPath;
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
          <p><a href="/" style="color: #818cf8;">Root Page</a> • <a href="/frontend/" style="color: #818cf8;">Frontend Portal</a></p>
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
  console.log(`📡 Root URL:     http://localhost:${PORT}`);
  console.log(`📡 Frontend URL: http://localhost:${PORT}/frontend/`);
  console.log(`======================================================\n`);
});
