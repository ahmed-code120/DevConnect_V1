import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "node:http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Database
const db = new Database(path.join(__dirname, "devconnect.db"));

// Set up schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT,
    name TEXT,
    avatar TEXT,
    bio TEXT,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    posts INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    time TEXT,
    desc TEXT,
    images TEXT,
    videoUrl TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    repository TEXT,
    liveDemo TEXT,
    tags TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    postId TEXT,
    name TEXT,
    avatar TEXT,
    text TEXT,
    likes INTEGER DEFAULT 0,
    time TEXT
  );
`);

// Function to handle initial data setup if DB is empty
const setupInitialData = () => {
  const countUsers = db.prepare("SELECT count(*) as c FROM users").get() as { c: number };
  if (countUsers.c === 0) {
      db.prepare(`
        INSERT INTO users (id, handle, name, avatar, bio, followers, following, posts)
        VALUES ('me', 'jakobbtsh', 'Jakob Botosh', 'https://i.pravatar.cc/150?u=12', 'Full-stack developer building cool things.', 2300, 235, 80)
      `).run();
  }

  const count = db.prepare("SELECT count(*) as c FROM posts").get() as { c: number };
  if (count.c === 0) {
    const insertPost = db.prepare(`
      INSERT INTO posts (id, name, avatar, time, desc, images, videoUrl, likes, comments, shares, repository, liveDemo, tags)
      VALUES (@id, @name, @avatar, @time, @desc, @images, @videoUrl, @likes, @comments, @shares, @repository, @liveDemo, @tags)
    `);
    const insertComment = db.prepare(`
      INSERT INTO comments (id, postId, name, avatar, text, likes, time)
      VALUES (@id, @postId, @name, @avatar, @text, @likes, @time)
    `);

    const initialPosts = [
        {
          id: "1",
          avatar: "https://i.pravatar.cc/150?u=32",
          name: "Cameron Williamson",
          time: "14 Aug at 4:21 PM",
          desc: "Just finished refactoring the 3D rendering pipeline for my WebGL portfolio. Check out the performance improvements! 🚀",
          images: JSON.stringify(["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop", "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop"]),
          videoUrl: null,
          likes: 30,
          comments: 2,
          shares: 5,
          repository: null,
          liveDemo: null,
          tags: JSON.stringify([])
        },
        {
            id: "2",
            avatar: "https://i.pravatar.cc/150?u=41",
            name: "Terry Lipshutz",
            time: "14 Aug at 1:12 PM",
            desc: "A sneak peak at the new auth module using neon glassmorphism effects. Thoughts? 🤔",
            images: JSON.stringify(["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"]),
            videoUrl: null,
            likes: 142,
            comments: 1,
            shares: 12,
            repository: "https://github.com/terry/glassmorphism-auth",
            liveDemo: null,
            tags: JSON.stringify([])
        }
    ];

    const initialComments = [
        { id: "c1", postId: "1", name: "User 1", avatar: "https://i.pravatar.cc/150?u=1c1", text: "Looks great!", likes: 5, time: "2 hours ago" },
        { id: "c2", postId: "1", name: "User 2", avatar: "https://i.pravatar.cc/150?u=1c2", text: "Amazing work.", likes: 2, time: "1 hour ago" },
        { id: "c3", postId: "2", name: "User 3", avatar: "https://i.pravatar.cc/150?u=2c3", text: "Very cool module.", likes: 8, time: "Just now" }
    ];

    const insertMany = db.transaction((posts, comments) => {
      for (const p of posts) insertPost.run(p);
      for (const c of comments) insertComment.run(c);
    });
    insertMany(initialPosts, initialComments);
  }
};
setupInitialData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = createServer(app);
  const io = new Server(server);

  app.use(express.json());

  // API Routes
  app.get("/api/posts", (req, res) => {
    const rows = db.prepare("SELECT * FROM posts ORDER BY time DESC").all() as any[];
    // parse json arrays
    const formatted = rows.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      videoUrl: r.videoUrl || undefined,
      repository: r.repository || undefined,
      liveDemo: r.liveDemo || undefined
    }));
    res.json(formatted);
  });

  app.post("/api/posts", (req, res) => {
    const { name, avatar, time, desc, images, videoUrl, repository, liveDemo, tags, id } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO posts (id, name, avatar, time, desc, images, videoUrl, repository, liveDemo, tags, likes, comments, shares)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    `);
    
    stmt.run(
      id || Date.now().toString(),
      name,
      avatar,
      time,
      desc,
      images ? JSON.stringify(images) : JSON.stringify([]),
      videoUrl || null,
      repository || null,
      liveDemo || null,
      tags ? JSON.stringify(tags) : JSON.stringify([])
    );
    
    const newPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as any;
    const formattedNewPost = {
        ...newPost,
        images: newPost.images ? JSON.parse(newPost.images) : undefined,
        tags: newPost.tags ? JSON.parse(newPost.tags) : undefined
    };

    io.emit("new_post", formattedNewPost);
    res.json({ success: true, post: formattedNewPost });
  });

  app.post("/api/posts/:id/like", (req, res) => {
    const id = req.params.id;
    db.prepare("UPDATE posts SET likes = likes + 1 WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as any;
    io.emit("post_updated", { id, action: 'like', likes: updated.likes });
    res.json({ success: true, likes: updated.likes });
  });
  
  app.post("/api/posts/:id/unlike", (req, res) => {
    const id = req.params.id;
    db.prepare("UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as any;
    io.emit("post_updated", { id, action: 'unlike', likes: updated.likes });
    res.json({ success: true, likes: updated.likes });
  });

  app.post("/api/posts/:id/comment", (req, res) => {
    // Legacy route
    const id = req.params.id;
    db.prepare("UPDATE posts SET comments = comments + 1 WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as any;
    io.emit("post_updated", { id, action: 'comment', comments: updated.comments });
    res.json({ success: true, comments: updated.comments });
  });
  
  app.get("/api/posts/:id/comments", (req, res) => {
    const id = req.params.id;
    const comments = db.prepare("SELECT * FROM comments WHERE postId = ? ORDER BY time DESC").all(id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", (req, res) => {
    const postId = req.params.id;
    const { id, name, avatar, text, time } = req.body;
    
    db.prepare(`
        INSERT INTO comments (id, postId, name, avatar, text, time, likes)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(id, postId, name, avatar, text, time);

    db.prepare("UPDATE posts SET comments = comments + 1 WHERE id = ?").run(postId);
    const updatedPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId) as any;
    
    const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
    
    io.emit("new_comment", newComment);
    io.emit("post_updated", { id: postId, action: 'comment', comments: updatedPost.comments });
    
    res.json({ success: true, comment: newComment });
  });

  app.post("/api/comments/:id/like", (req, res) => {
    const id = req.params.id;
    db.prepare("UPDATE comments SET likes = likes + 1 WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
    res.json({ success: true, comment: updated });
  });

  app.post("/api/comments/:id/unlike", (req, res) => {
    const id = req.params.id;
    db.prepare("UPDATE comments SET likes = MAX(0, likes - 1) WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
    res.json({ success: true, comment: updated });
  });

  app.get("/api/users/me", (req, res) => {
     const me = db.prepare("SELECT * FROM users WHERE id = 'me'").get();
     res.json(me);
  });
  
  app.put("/api/users/me", (req, res) => {
     const { name, bio, handle } = req.body;
     db.prepare("UPDATE users SET name = ?, bio = ?, handle = ? WHERE id = 'me'").run(name, bio, handle);
     const me = db.prepare("SELECT * FROM users WHERE id = 'me'").get();
     io.emit("user_updated", me);
     res.json(me);
  });
  
  app.delete("/api/posts/:id", (req, res) => {
    const id = req.params.id;
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    io.emit("post_deleted", { id });
    res.json({ success: true });
  });

  // Websocket connection event
  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
