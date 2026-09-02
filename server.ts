import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  // Basic security headers without an extra runtime dependency.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Telegram credentials stay on the server. Never expose bot tokens through VITE_* vars.
  app.post("/api/notifications/telegram", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!token || !chatId) return res.status(503).json({ error: "notification_not_configured" });
    if (!message || message.length > 4096) return res.status(400).json({ error: "invalid_message" });

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      if (!response.ok) return res.status(502).json({ error: "notification_failed" });
      return res.status(204).end();
    } catch {
      return res.status(502).json({ error: "notification_failed" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🏭 Andon Server running on http://localhost:${PORT}`);
  });
}

startServer();
