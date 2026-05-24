import { Router } from "express";
import valkey from "../lib/valkey";

const DEFAULT_TRENDS = [
  { name: "Handmade Jewelry", count: 142, trend: "up" as const, emoji: "💎" },
  { name: "Organic Skincare", count: 128, trend: "up" as const, emoji: "✨" },
  { name: "Home Bakery", count: 115, trend: "up" as const, emoji: "🍰" },
  { name: "Mehendi Services", count: 98, trend: "up" as const, emoji: "🌿" },
  { name: "Fashion Design", count: 87, trend: "stable" as const, emoji: "👗" },
  { name: "Handmade Candles", count: 74, trend: "up" as const, emoji: "🕯️" },
  { name: "Yoga & Wellness", count: 65, trend: "stable" as const, emoji: "🧘" },
  { name: "Art & Crafts", count: 59, trend: "up" as const, emoji: "🎨" },
  { name: "Plants & Gardening", count: 51, trend: "stable" as const, emoji: "🌱" },
  { name: "Home Food Business", count: 48, trend: "up" as const, emoji: "🍽️" },
];

const nicheEmojis: Record<string, string> = {
  "Handmade Jewelry": "💎",
  "Organic Skincare": "✨",
  "Home Bakery": "🍰",
  "Mehendi Services": "🌿",
  "Fashion Design": "👗",
  "Handmade Candles": "🕯️",
  "Yoga & Wellness": "🧘",
  "Art & Crafts": "🎨",
  "Plants & Gardening": "🌱",
  "Home Food Business": "🍽️",
};

function getEmoji(niche: string): string {
  return nicheEmojis[niche] ?? "🚀";
}

const router = Router();

router.get("/trending", async (_req, res): Promise<void> => {
  const raw = await valkey.zrevrange("shelaunch:trending:niches", 0, 9);

  if (raw.length === 0) {
    for (const trend of DEFAULT_TRENDS) {
      await valkey.zincrby("shelaunch:trending:niches", trend.count, trend.name);
    }
    res.json(DEFAULT_TRENDS);
    return;
  }

  const trending = raw.map(({ member, score }, index) => ({
    name: member,
    count: Math.round(score),
    trend: index < 4 ? "up" : index < 7 ? "stable" : "down" as "up" | "down" | "stable",
    emoji: getEmoji(member),
  }));

  if (trending.length < 6) {
    for (const def of DEFAULT_TRENDS) {
      if (!trending.find((t) => t.name === def.name)) {
        trending.push(def);
        if (trending.length >= 10) break;
      }
    }
  }

  res.json(trending);
});

export default router;
