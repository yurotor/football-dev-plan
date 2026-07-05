import { Redis } from "@upstash/redis";

// Works with either the native Upstash Vercel integration
// (UPSTASH_REDIS_REST_*) or Vercel KV (KV_REST_API_*).
let _redis = null;
function getRedis() {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing Upstash env vars (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)"
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const KEY = "olim-rama:data";
const EMPTY = { version: 1, player: { name: "" }, sessions: [], tests: [] };

function clean(body) {
  return {
    version: 1,
    player: {
      name:
        body && body.player && body.player.name
          ? String(body.player.name).slice(0, 80)
          : "",
    },
    // Trust the client shape; the app only ever sends its own records.
    sessions: Array.isArray(body.sessions) ? body.sessions : [],
    tests: Array.isArray(body.tests) ? body.tests : [],
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const data = await getRedis().get(KEY);
      return res.status(200).json(data || EMPTY);
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.sessions) || !Array.isArray(body.tests)) {
        return res.status(400).json({ error: "bad payload" });
      }
      const doc = clean(body);
      await getRedis().set(KEY, doc);
      return res.status(200).json(doc);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
