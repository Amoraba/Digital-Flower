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

interface AnalyticsEvent {
  id: string;
  eventType: "gift_created" | "gift_opened" | "gift_shared";
  giftId: string;
  createdAt: string;
}

const ANALYTICS_FILE = path.join(process.cwd(), "analytics_db.json");

async function readLocalAnalytics(): Promise<AnalyticsEvent[]> {
  try {
    const data = await fs.readFile(ANALYTICS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function writeLocalAnalytics(events: AnalyticsEvent[]) {
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(events, null, 2), "utf-8");
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

  // Unified Multi-Persistence Analytics System
  async function logAnalyticsEvent(eventType: "gift_created" | "gift_opened" | "gift_shared", giftId: string): Promise<void> {
    const event: AnalyticsEvent = {
      id: Math.random().toString(36).substring(2, 10),
      eventType,
      giftId,
      createdAt: new Date().toISOString()
    };

    const client = initSupabase();
    let loggedToSupabase = false;

    if (isSupabaseConfigured && client) {
      try {
        const row = {
          id: event.id,
          event_type: event.eventType,
          gift_id: event.giftId,
          created_at: event.createdAt
        };
        const { error } = await client.from("gift_analytics").insert(row);
        if (error) {
          console.warn("[Supabase Analytics Warning] Failed to insert to gift_analytics table (likely missing schema). Falling back to JSON DB:", error.message);
        } else {
          loggedToSupabase = true;
          console.log(`[Supabase Analytics] Successfully tracked event '${eventType}' for gift ID ${giftId}`);
        }
      } catch (err: any) {
        console.warn("[Supabase Analytics Exception] Skipped remote tracking, falling back to local files:", err?.message || err);
      }
    }

    // Always keep local JSON DB in sync for fully working fallbacks
    try {
      const events = await readLocalAnalytics();
      events.push(event);
      await writeLocalAnalytics(events);
      console.log(`[Local Analytics] Logged '${eventType}' for gift ${giftId}`);
    } catch (localErr: any) {
      console.error("[Local Analytics Fail] Unable to append local log event:", localErr?.message);
    }
  }

  // Admin Dashboard Statistics Processor
  async function getAdminMetrics() {
    let allGifts: Gift[] = [];
    let allEvents: AnalyticsEvent[] = [];
    
    const client = initSupabase();
    let loadedFromSupabase = false;

    if (isSupabaseConfigured && client) {
      try {
        const { data: giftsData, error: giftsError } = await client.from("gifts").select("*");
        const { data: eventsData, error: eventsError } = await client.from("gift_analytics").select("*");

        if (giftsError) {
          console.warn("[Supabase Admin Fallback] Could not select gifts table:", giftsError.message);
        } else if (giftsData) {
          allGifts = giftsData.map(mapRowToGift);
          loadedFromSupabase = true;
        }

        if (eventsError) {
          console.warn("[Supabase Admin Fallback] Could not select gift_analytics table:", eventsError.message);
        } else if (eventsData) {
          allEvents = eventsData.map((row: any) => ({
            id: row.id,
            eventType: (row.event_type || row.eventType || "gift_created") as any,
            giftId: row.gift_id || row.giftId || "",
            createdAt: row.created_at || row.createdAt || new Date().toISOString()
          }));
        }
      } catch (err: any) {
        console.warn("[Supabase Admin Metrics Exception] Querying metrics through local fallback. Error:", err?.message || err);
      }
    }

    // Load backup local datasets
    const localStoreMap = await readLocalGifts();
    const localGifts = Object.values(localStoreMap);
    const localEvents = await readLocalAnalytics();

    // Splicing datasets beautifully - merge local & remote uniquely so we do not lose local counts
    if (!loadedFromSupabase) {
      allGifts = localGifts;
    } else {
      const dbIds = new Set(allGifts.map(g => g.id));
      localGifts.forEach(g => {
        if (!dbIds.has(g.id)) allGifts.push(g);
      });
    }

    // merge events uniquely
    if (allEvents.length === 0) {
      allEvents = localEvents;
    } else {
      const evIds = new Set(allEvents.map(e => e.id));
      localEvents.forEach(e => {
        if (!evIds.has(e.id)) allEvents.push(e);
      });
    }

    // Computing dashboard deliverables
    const totalGifts = allGifts.length;

    // Opened Gifts count: unique giftId that experienced a 'gift_opened' event
    const openedGiftIds = new Set(
      allEvents
        .filter(e => e.eventType === "gift_opened")
        .map(e => e.giftId)
    );
    const openedGiftsCount = openedGiftIds.size;

    // Top Flower Choice
    const flowerMap: Record<string, number> = {};
    allGifts.forEach(g => {
      const fl = g.flowerType || "Unknown";
      flowerMap[fl] = (flowerMap[fl] || 0) + 1;
    });
    let topFlower = "None";
    let topFlowerCount = 0;
    Object.entries(flowerMap).forEach(([flower, count]) => {
      if (count > topFlowerCount) {
        topFlower = flower;
        topFlowerCount = count;
      }
    });

    // Top Occasion
    const occasionMap: Record<string, number> = {};
    allGifts.forEach(g => {
      const oc = g.occasion || "Unknown";
      occasionMap[oc] = (occasionMap[oc] || 0) + 1;
    });
    let topOccasion = "None";
    let topOccasionCount = 0;
    Object.entries(occasionMap).forEach(([occ, count]) => {
      if (count > topOccasionCount) {
        topOccasion = occ;
        topOccasionCount = count;
      }
    });

    // Voice Notes count: check how many gifts contain either a sound file base64 or a link
    const voiceNotesSent = allGifts.filter(g => g.voiceNoteBase64 && g.voiceNoteBase64.length > 20).length;

    // Build the analytics events log table with enriched gift data
    const giftsMap = new Map(allGifts.map(g => [g.id, g]));
    const eventsTableData = allEvents.map(e => {
      const matchingGift = giftsMap.get(e.giftId);
      return {
        id: e.id,
        eventType: e.eventType,
        giftId: e.giftId,
        createdAt: e.createdAt,
        recipientName: matchingGift ? matchingGift.recipientName : "Unknown",
        senderName: matchingGift ? (matchingGift.senderName || "Someone Special") : "Someone Special",
        occasion: matchingGift ? matchingGift.occasion : "Unknown",
        flowerType: matchingGift ? matchingGift.flowerType : "Unknown"
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      metrics: {
        totalGifts,
        openedGifts: openedGiftsCount,
        topFlower: topFlowerCount > 0 ? `${topFlower} (${topFlowerCount})` : "None",
        topOccasion: topOccasionCount > 0 ? `${topOccasion} (${topOccasionCount})` : "None",
        voiceNotesSent
      },
      events: eventsTableData,
      gifts: allGifts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
      databaseStatus: {
        isSupabaseConfigured,
        loadedFromSupabase
      }
    };
  }


  // --- RESTful Api Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Log client analytics events manually (e.g., share events)
  app.post("/api/analytics", async (req, res) => {
    try {
      const { eventType, giftId } = req.body;
      if (!eventType || !giftId) {
        return res.status(400).json({ error: "eventType and giftId are required." });
      }

      if (eventType !== "gift_created" && eventType !== "gift_opened" && eventType !== "gift_shared") {
        return res.status(400).json({ error: "Invalid eventType value." });
      }

      await logAnalyticsEvent(eventType, giftId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Unable to log analytic event." });
    }
  });

  // Admin Metrics API Access point
  app.get("/api/admin/metrics", async (req, res) => {
    try {
      const metricsData = await getAdminMetrics();
      res.json(metricsData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to compile admin metrics dashboard." });
    }
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

    try {
      await logAnalyticsEvent("gift_opened", id);
    } catch (e) {
      console.warn("[Analytics Error] Could not auto-log gift open event for", id);
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

      try {
        await logAnalyticsEvent("gift_created", id);
      } catch (e) {
        console.warn("[Analytics Error] Could not auto-log gift create event for", id);
      }

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
