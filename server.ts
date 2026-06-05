import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GIFTS_FILE = path.join(process.cwd(), "gifts_db.json");

interface Gift {
  id: string;
  occasion: string;
  flowerType: string;
  flowerColor: string;
  recipientName: string;
  senderName?: string;
  personalMessage: string;
  voiceNoteUrl?: string;
  voiceNoteBase64?: string;
  musicCategory: string;
  musicTrack: string;
  createdAt: string;
  paymentMethod?: string;
  status: "pending" | "paid";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increase for sound recording uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Helper file reading
  async function readGifts(): Promise<Record<string, Gift>> {
    try {
      const data = await fs.readFile(GIFTS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  // Helper file writing
  async function writeGifts(gifts: Record<string, Gift>) {
    await fs.writeFile(GIFTS_FILE, JSON.stringify(gifts, null, 2), "utf-8");
  }

  // Init check for gifts json
  try {
    await readGifts();
  } catch (e) {
    await writeGifts({});
  }

  // --- RESTful Api Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Solve Vite dev server 404s by redirecting nested routes to root page with query parameters
  app.get("/gift/:id", (req, res) => {
    res.redirect(`/?giftId=${req.params.id}`);
  });

  // Get a specific flower gift by ID
  app.get("/api/gifts/:id", async (req, res) => {
    const { id } = req.params;
    const gifts = await readGifts();
    const gift = gifts[id];

    if (!gift) {
      return res.status(404).json({ error: "Flower gift does not exist or has expired." });
    }

    res.json(gift);
  });

  // Create a pending flower gift awaiting transaction clearance
  app.post("/api/gifts", async (req, res) => {
    try {
      const giftData: Omit<Gift, "id" | "createdAt" | "status"> = req.body;

      if (!giftData.recipientName || !giftData.personalMessage) {
        return res.status(400).json({ error: "Recipient name and message body are required." });
      }

      // Generate elegant unique 8 character hex-token
      const id = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
      const gifts = await readGifts();

      const newGift: Gift = {
        ...giftData,
        id,
        status: "paid",
        createdAt: new Date().toISOString(),
      };

      gifts[id] = newGift;
      await writeGifts(gifts);

      res.status(200).json(newGift);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to catalog temporary flower gift request" });
    }
  });

  // Pay Egyptian service provider & lock confirmation
  app.post("/api/gifts/:id/pay", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({ error: " Egyptian cash / wallet credentials required to activate gift." });
      }

      const gifts = await readGifts();
      const gift = gifts[id];

      if (!gift) {
        return res.status(404).json({ error: "Selected gift draft has expired or expired." });
      }

      gift.status = "paid";
      gift.paymentMethod = paymentMethod;
      gifts[id] = gift;
      await writeGifts(gifts);

      res.json(gift);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Egyptian integration gateway transaction fail" });
    }
  });

  // --- Dynamic Single Page App Hosting Router ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback pass to solve custom /gift/:id URL paths beautifully in single page routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Portal] Online at http://localhost:${PORT}`);
  });
}

startServer().catch((crash) => {
  console.error("Express startup failure:", crash);
});
