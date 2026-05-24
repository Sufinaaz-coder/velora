import { Router } from "express";
import { generateCampaign, generateWithCache, checkRateLimit, getSessionMemory } from "../../lib/groq";
import { GenerateCampaignBody } from "@workspace/api-zod";
import valkey from "../../lib/valkey";

const router = Router();

router.post("/ai/campaign", async (req, res): Promise<void> => {
  const parsed = GenerateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { festival, tone, sessionId } = parsed.data;
  let { businessContext } = parsed.data;

  if (!businessContext && sessionId) {
    businessContext = await getSessionMemory(sessionId);
  }

  const rateLimitId = sessionId ?? req.ip ?? "anon";
  const { allowed } = await checkRateLimit(`campaign:${rateLimitId}`, 20, 3600);
  if (!allowed) {
    res.status(429).json({ error: "Rate limit exceeded. Please wait before generating again." });
    return;
  }

  valkey.trackPrompt(`${festival} campaign (${tone})`);

  const cacheInput = `${festival}:${tone}:${(businessContext ?? "").slice(0, 50)}`;

  try {
    const { result, fromCache } = await generateWithCache(
      "campaign",
      cacheInput.toLowerCase().trim(),
      () => generateCampaign(festival, tone, businessContext)
    );

    res.json({ ...result, fromCache });
  } catch (err) {
    req.log.error({ err }, "Campaign generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

export default router;
