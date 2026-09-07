import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Telegram credentials are intentionally server-only. Never expose the bot
  // token through VITE_* variables or return it to the browser.
  app.post("/api/notifications/telegram", async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!botToken || !chatId) {
      return res.status(503).json({ ok: false, error: "Telegram notifications are not configured." });
    }

    if (!message || message.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
      return res.status(400).json({ ok: false, error: "Invalid Telegram message." });
    }

    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      if (!telegramResponse.ok) {
        console.error("Telegram notification failed with HTTP status", telegramResponse.status);
        return res.status(502).json({ ok: false, error: "Telegram delivery failed." });
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Telegram notification request failed.", error);
      return res.status(502).json({ ok: false, error: "Telegram delivery failed." });
    }
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🏭 Andon Server running on http://localhost:${PORT}`);
  });
}

startServer();
