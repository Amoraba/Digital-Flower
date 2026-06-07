import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

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

// Map database columns (including custom snake_case columns) to camelCase types back & forth
function mapRowToGift(row: any): Gift {
  return {
    id: row.id,
    occasion: row.occasion,
    flowerType: row.flower_type || row.flowerType || "",
    flowerColor: row.flower_color || row.flowerColor || "",
    recipientName: row.recipient_name || row.recipientName || "",
    senderName: row.sender_name || row.senderName || undefined,
    personalMessage: row.personal_message || row.personalMessage || "",
    voiceNoteBase64: row.voice_note_base64 || row.voiceNoteBase64 || undefined,
    musicCategory: row.music_category || row.musicCategory || "",
    musicTrack: row.music_track || row.musicTrack || "",
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: (row.status || "paid") as "pending" | "paid",
    paymentMethod: row.payment_method || row.paymentMethod || undefined,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increase for sound recording uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Supabase Lazy Initialization Loader
  let supabaseClient: any = null;
  let isSupabaseConfigured = false;

  function initSupabase() {
    if (supabaseClient) return supabaseClient;

    const url = process.env.SUPABASE_URL?.trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

    if (url && key && url.startsWith("http") && !url.includes("placeholder")) {
      try {
        supabaseClient = createClient(url, key, {
          auth: {
            persistSession: false,
          },
        });
        isSupabaseConfigured = true;
        console.log("[Supabase Server] Connected securely dynamically.");
      } catch (err: any) {
        console.error("[Supabase Server] Connection initialization error:", err?.message || err);
        isSupabaseConfigured = false;
        supabaseClient = null;
      }
    } else {
      if (url || key) {
        console.log(
          "[Supabase Info] Supabase credentials in environment are incomplete or placeholder values. " +
          "Using local filesystem fallback (gifts_db.json)."
        );
      }
      isSupabaseConfigured = false;
    }
    return supabaseClient;
  }

  // Local filesystem persistence helper (as a backup mechanism)
  async function readLocalGifts(): Promise<Record<string, Gift>> {
    try {
      const data = await fs.readFile(GIFTS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  async function writeLocalGifts(gifts: Record<string, Gift>) {
    await fs.writeFile(GIFTS_FILE, JSON.stringify(gifts, null, 2), "utf-8");
  }

  // Core Data Retrieval Endpoint Handler
  async function getGiftById(id: string): Promise<Gift | null> {
    const client = initSupabase();
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from("gifts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error(`[Supabase Error] getGiftById on ${id} triggered db error:`, error.message);
          throw error;
        }
        if (data) {
          return mapRowToGift(data);
        }
      } catch (err) {
        console.warn(`[Supabase Fallback] getGiftById failed with exception, querying gifts_db.json fallback. Clean error:`, err);
      }
    }

    // fallback to JSON db
    const localStore = await readLocalGifts();
    return localStore[id] || null;
  }

  // Core Data Writing Endpoint Handler
  async function saveGift(gift: Gift): Promise<void> {
    const client = initSupabase();
    if (isSupabaseConfigured && client) {
      try {
        const row = {
          id: gift.id,
          occasion: gift.occasion,
          flower_type: gift.flowerType,
          flower_color: gift.flowerColor,
          recipient_name: gift.recipientName,
          sender_name: gift.senderName || null,
          personal_message: gift.personalMessage,
          voice_note_base64: gift.voiceNoteBase64 || null,
          music_category: gift.musicCategory,
          music_track: gift.musicTrack,
          status: gift.status,
          created_at: gift.createdAt,
          payment_method: gift.paymentMethod || null,
        };

        const { error } = await client
          .from("gifts")
          .upsert(row, { onConflict: "id" });

        if (error) {
          console.error(`[Supabase Error] saveGift on ${gift.id} triggered db error:`, error.message);
          throw error;
        }
        console.log(`[Supabase Server] Successfully upserted gift item ${gift.id} to gifts table.`);
        return;
      } catch (err) {
        console.warn(`[Supabase Fallback] saveGift failed with exception, syncing to gifts_db.json fallback instead. Clean error:`, err);
      }
    }

    // fallback to JSON db
    const localStore = await readLocalGifts();
    localStore[gift.id] = gift;
    await writeLocalGifts(localStore);
  }

  // One-time auto migration of local gift data to Supabase if it's set up
  async function migrateGiftsToSupabase() {
    const client = initSupabase();
    if (!isSupabaseConfigured || !client) return;

    try {
      const localGifts = await readLocalGifts();
      const ids = Object.keys(localGifts);
      if (ids.length === 0) return;

      console.log(`[Supabase Migration] Syncing local files to server: detected ${ids.length} entries to migrate.`);
      for (const id of ids) {
        const gift = localGifts[id];
        const row = {
          id: gift.id,
          occasion: gift.occasion,
          flower_type: gift.flowerType,
          flower_color: gift.flowerColor,
          recipient_name: gift.recipientName,
          sender_name: gift.senderName || null,
          personal_message: gift.personalMessage,
          voice_note_base64: gift.voiceNoteBase64 || null,
          music_category: gift.musicCategory,
          music_track: gift.musicTrack,
          status: gift.status,
          created_at: gift.createdAt,
          payment_method: gift.paymentMethod || null,
        };

        const { error } = await client.from("gifts").upsert(row, { onConflict: "id" });
        if (error) {
          console.warn(`[Supabase Migration API] Error migrating record ${id}:`, error.message);
        } else {
          console.log(`[Supabase Migration API] Synced record ID ${id} to remote table.`);
        }
      }

      // Rename JSON db file so we do not run migration multiple times
      try {
        await fs.rename(GIFTS_FILE, path.join(process.cwd(), "gifts_db.json.migrated_to_supabase"));
        console.log("[Supabase Migration] local gifts file successfully renamed.");
      } catch (e) {
        // Safe to bypass if rename encounters systems permissions issue
      }
    } catch (err) {
      console.error("[Supabase Migration Warning] Auto-migration pipeline skipped:", err);
    }
  }

  // Execute check-migrator
  await migrateGiftsToSupabase();


  // --- RESTful Api Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Solve Vite dev server 404s by redirecting nested routes to root page with query parameters
  app.get("/gift/:id", (req, res) => {
    res.redirect(`/?giftId=${req.params.id}`);
  });

  // Short path redirect for compact links
  app.get("/g/:id", (req, res) => {
    res.redirect(`/?giftId=${req.params.id}`);
  });

  // Get a specific flower gift by ID
  app.get("/api/gifts/:id", async (req, res) => {
    const { id } = req.params;
    const gift = await getGiftById(id);

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

      const newGift: Gift = {
        ...giftData,
        id,
        status: "paid",
        createdAt: new Date().toISOString(),
      };

      await saveGift(newGift);

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

      const gift = await getGiftById(id);

      if (!gift) {
        return res.status(404).json({ error: "Selected gift draft has expired or expired." });
      }

      gift.status = "paid";
      gift.paymentMethod = paymentMethod;
      await saveGift(gift);

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
