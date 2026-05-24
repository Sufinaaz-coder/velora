import Redis from "ioredis";
import { logger } from "./logger";

type ValkeyClient = Redis | null;

let client: ValkeyClient = null;
let connected = false;
let startTime = Date.now();

const inMemoryStore: Map<string, { value: string; expiry: number | null }> = new Map();
let cacheHits = 0;
let cacheMisses = 0;
let totalRequests = 0;
const topPromptsMap: Map<string, number> = new Map();
const activeUserIds: Set<string> = new Set();

async function initValkey() {
  const valkeyUrl = process.env.VALKEY_URL || process.env.REDIS_URL;

  if (valkeyUrl) {
    try {
      client = new Redis(valkeyUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        enableOfflineQueue: false,
      });

      await client.connect();
      connected = true;
      logger.info("Valkey connected successfully");

      client.on("error", (err) => {
        logger.warn({ err }, "Valkey connection error — falling back to in-memory");
        connected = false;
      });

      client.on("reconnecting", () => {
        logger.info("Valkey reconnecting...");
      });

      client.on("connect", () => {
        connected = true;
        logger.info("Valkey reconnected");
      });
    } catch (err) {
      logger.warn({ err }, "Valkey unavailable — using in-memory store");
      client = null;
      connected = false;
    }
  } else {
    logger.info("VALKEY_URL not set — using in-memory Valkey simulation");
  }
}

function inMemoryGet(key: string): string | null {
  const item = inMemoryStore.get(key);
  if (!item) return null;
  if (item.expiry !== null && Date.now() > item.expiry) {
    inMemoryStore.delete(key);
    return null;
  }
  return item.value;
}

function inMemorySet(key: string, value: string, ttlSeconds?: number): void {
  inMemoryStore.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

function inMemoryDel(key: string): void {
  inMemoryStore.delete(key);
}

function inMemoryIncr(key: string): number {
  const current = inMemoryGet(key);
  const next = (parseInt(current || "0", 10) + 1).toString();
  inMemorySet(key, next);
  return parseInt(next, 10);
}

function inMemoryZIncrBy(key: string, increment: number, member: string): void {
  const raw = inMemoryGet(key);
  const map: Record<string, number> = raw ? JSON.parse(raw) : {};
  map[member] = (map[member] || 0) + increment;
  inMemorySet(key, JSON.stringify(map));
}

function inMemoryZRevRange(key: string, start: number, stop: number): Array<{ member: string; score: number }> {
  const raw = inMemoryGet(key);
  if (!raw) return [];
  const map: Record<string, number> = JSON.parse(raw);
  const sorted = Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(start, stop === -1 ? undefined : stop + 1);
  return sorted.map(([member, score]) => ({ member, score }));
}

export const valkey = {
  isConnected(): boolean {
    return connected || client === null;
  },

  async get(key: string): Promise<string | null> {
    if (client && connected) {
      return client.get(key);
    }
    return inMemoryGet(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (client && connected) {
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
    } else {
      inMemorySet(key, value, ttlSeconds);
    }
  },

  async del(key: string): Promise<void> {
    if (client && connected) {
      await client.del(key);
    } else {
      inMemoryDel(key);
    }
  },

  async incr(key: string): Promise<number> {
    if (client && connected) {
      return client.incr(key);
    }
    return inMemoryIncr(key);
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (client && connected) {
      await client.expire(key, seconds);
    } else {
      const item = inMemoryStore.get(key);
      if (item) {
        inMemoryStore.set(key, { ...item, expiry: Date.now() + seconds * 1000 });
      }
    }
  },

  async zincrby(key: string, increment: number, member: string): Promise<void> {
    if (client && connected) {
      await client.zincrby(key, increment, member);
    } else {
      inMemoryZIncrBy(key, increment, member);
    }
  },

  async zrevrange(key: string, start: number, stop: number): Promise<Array<{ member: string; score: number }>> {
    if (client && connected) {
      const results = await client.zrevrange(key, start, stop, "WITHSCORES");
      const out: Array<{ member: string; score: number }> = [];
      for (let i = 0; i < results.length; i += 2) {
        out.push({ member: results[i], score: parseFloat(results[i + 1]) });
      }
      return out;
    }
    return inMemoryZRevRange(key, start, stop);
  },

  async hset(key: string, field: string, value: string): Promise<void> {
    if (client && connected) {
      await client.hset(key, field, value);
    } else {
      const raw = inMemoryGet(key);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[field] = value;
      inMemorySet(key, JSON.stringify(map));
    }
  },

  async hget(key: string, field: string): Promise<string | null> {
    if (client && connected) {
      return client.hget(key, field);
    }
    const raw = inMemoryGet(key);
    if (!raw) return null;
    const map: Record<string, string> = JSON.parse(raw);
    return map[field] ?? null;
  },

  async hgetall(key: string): Promise<Record<string, string>> {
    if (client && connected) {
      return client.hgetall(key) as Promise<Record<string, string>>;
    }
    const raw = inMemoryGet(key);
    if (!raw) return {};
    return JSON.parse(raw);
  },

  recordCacheHit() {
    cacheHits++;
    totalRequests++;
  },

  recordCacheMiss() {
    cacheMisses++;
    totalRequests++;
  },

  trackPrompt(prompt: string) {
    const key = prompt.slice(0, 50).toLowerCase();
    topPromptsMap.set(key, (topPromptsMap.get(key) || 0) + 1);
    this.zincrby("shelaunch:trending:prompts", 1, key).catch(() => {});
  },

  trackActiveUser(sessionId: string) {
    activeUserIds.add(sessionId);
    setTimeout(() => activeUserIds.delete(sessionId), 5 * 60 * 1000);
  },

  trackTrendingNiche(niche: string) {
    this.zincrby("shelaunch:trending:niches", 1, niche).catch(() => {});
  },

  async getStats() {
    const topPrompts = Array.from(topPromptsMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([prompt, count]) => ({ prompt, count }));

    return {
      cacheHits,
      cacheMisses,
      activeUsers: activeUserIds.size,
      totalRequests,
      topPrompts,
      valkeyConnected: connected,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  },
};

initValkey().catch((err) => {
  logger.warn({ err }, "Valkey init failed");
});

export default valkey;
