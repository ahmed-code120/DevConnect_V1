import express, { type Request, type Response } from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Server } from "socket.io";
import path from "node:path";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 8080);
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Proxy configuration for PHP backend (XAMPP Apache)
  app.use('/api/php', createProxyMiddleware({
    target: 'http://127.0.0.1/devconnect_api',
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url}`);
      },
    },
    pathRewrite: {
      '^/api/php': '',
    },
  }));

  app.use(express.json({ limit: "25mb" }));

  // Socket.io setup
  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    
    socket.on("new_post", (data) => {
      socket.broadcast.emit("new_post", data);
    });

    socket.on("post_updated", (data) => {
      socket.broadcast.emit("post_updated", data);
    });

    socket.on("post_deleted", (data) => {
      socket.broadcast.emit("post_deleted", data);
    });

    socket.on("new_message", (data) => {
      io.emit("new_message", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // Internal API for PHP to trigger socket events (Optional but good for real-time)
  app.post("/api/internal/emit", (req, res) => {
    const { event, data } = req.body;
    if (event) {
      io.emit(event, data);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Missing event name" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend + Socket.io Server running on http://localhost:${PORT}`);
    console.log("Make sure the PHP backend is running on http://localhost:8000");
  });
}

startServer();
