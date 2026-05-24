import { Router } from "express";
import { generateBusinessLaunch, generateWithCache, checkRateLimit, getSessionMemory, setSessionMemory } from "../../lib/groq";
import { GenerateBusinessLaunchBody } from "@workspace/api-zod";
import valkey from "../../lib/valkey";

const router = Router();

router.post("/ai/business-launch", async (req, res): Promise<void> => {
  const parsed = GenerateBusinessLaunchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessIdea, sessionId } = parsed.data;
  const rateLimitId = sessionId ?? req.ip ?? "anon";
  const { allowed } = await checkRateLimit(`business:${rateLimitId}`, 20, 3600);
  if (!allowed) {
    res.status(429).json({ error: "Rate limit exceeded. Please wait before generating again." });
    return;
  }

  if (sessionId) {
    await setSessionMemory(sessionId, {
      businessContext: businessIdea,
      lastUpdated: new Date().toISOString(),
    });
  }

  valkey.trackPrompt(businessIdea);

  const nicheKeywords = ["jewelry", "jewellery", "skincare", "bakery", "fashion", "mehendi", "henna", "candles", "yoga", "art", "plants", "organic", "food", "clothing"];
  for (const kw of nicheKeywords) {
    if (businessIdea.toLowerCase().includes(kw)) {
      const nicheMap: Record<string, string> = {
        jewelry: "Handmade Jewelry", jewellery: "Handmade Jewelry",
        skincare: "Organic Skincare", bakery: "Home Bakery",
        fashion: "Fashion Design", mehendi: "Mehendi Services", henna: "Mehendi Services",
        candles: "Handmade Candles", yoga: "Yoga & Wellness", art: "Art & Crafts",
        plants: "Plants & Gardening", organic: "Organic Products",
        food: "Home Food Business", clothing: "Fashion Design",
      };
      valkey.trackTrendingNiche(nicheMap[kw] || businessIdea.split(" ").slice(0, 3).join(" "));
      break;
    }
  }

  try {
    const { result, fromCache, cacheKey } = await generateWithCache(
      "business",
      businessIdea.toLowerCase().trim(),
      () => generateBusinessLaunch(businessIdea)
    );

    res.json({ ...result, fromCache, cacheKey: fromCache ? cacheKey : null });
  } catch (err) {
    req.log.error({ err }, "Business launch generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

export default router;
