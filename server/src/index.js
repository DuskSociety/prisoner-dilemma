import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { setupSocketHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Try to serve built frontend if available (production mode)
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  console.log('Serving static frontend from', distPath);
  // Serve static assets (JS, CSS, images, manifest, etc.)
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for all non-static, non-socket.io routes
  app.get('*', (req, res, next) => {
    // Don't intercept socket.io or health check
    if (req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    // Only serve index.html for HTML-accepting requests (not API calls)
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Dev mode - show status page
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>塑料好朋友 - 服务端</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}.card{background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.08);text-align:center}h1{color:#2e75b6;margin:0 0 8px}.status{display:inline-block;background:#dcfce7;color:#166534;padding:4px 12px;border-radius:999px;font-size:14px}</style></head>
<body><div class="card"><h1>塑料好朋友</h1><p>游戏服务端运行中</p><div class="status">在线</div><p style="color:#64748b;font-size:14px">端口 ${PORT} | 请启动前端: cd client && npm run dev</p></div></body></html>`);
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (fs.existsSync(distPath)) {
    console.log(`Open http://localhost:${PORT} to play`);
  }
});
