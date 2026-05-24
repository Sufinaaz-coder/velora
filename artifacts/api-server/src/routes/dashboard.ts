import { Router } from "express";
import { db, savedGenerationsTable, conversationsTable } from "@workspace/db";
import { count, desc } from "drizzle-orm";
import valkey from "../lib/valkey";

const router = Router();

router.get("/dashboard/analytics", async (req, res): Promise<void> => {
  const [genResult] = await db.select({ count: count() }).from(savedGenerationsTable);
  const [convResult] = await db.select({ count: count() }).from(conversationsTable);

  const allGens = await db
    .select()
    .from(savedGenerationsTable)
    .orderBy(desc(savedGenerationsTable.createdAt))
    .limit(50);

  const campaigns = allGens.filter((g) => g.type === "campaign");
  const business = allGens.filter((g) => g.type === "business");

  const stats = await valkey.getStats();
  const cacheHitRate =
    stats.totalRequests > 0
      ? Math.round((stats.cacheHits / stats.totalRequests) * 100)
      : 0;

  const topNiches = await valkey.zrevrange("shelaunch:trending:niches", 0, 4);
  const topBusinessIdeas = topNiches.length > 0
    ? topNiches.map((n) => n.member)
    : ["Handmade Jewelry", "Organic Skincare", "Home Bakery", "Fashion Design", "Mehendi Services"];

  const topPrompts = await valkey.zrevrange("shelaunch:trending:prompts", 0, 4);
  const topFestivals = topPrompts.length > 0
    ? topPrompts.map((p) => p.member).filter((p) => p.includes("campaign"))
    : ["Diwali", "Women's Day", "Eid", "Raksha Bandhan", "New Year"];

  const recentActivity = allGens.slice(0, 10).map((g) => ({
    type: g.type,
    description: `Generated ${g.type} content: ${g.title}`,
    timestamp: g.createdAt.toISOString(),
  }));

  const totalGenCount = (genResult?.count ?? 0) as number;
  const launchReadinessScore = Math.min(100, 30 + totalGenCount * 10);
  const engagementScore = Math.min(100, 20 + (convResult?.count ?? 0) as number * 15 + campaigns.length * 5);

  res.json({
    totalGenerations: totalGenCount,
    totalCampaigns: campaigns.length,
    totalConversations: (convResult?.count ?? 0) as number,
    cacheHitRate,
    topBusinessIdeas,
    topFestivals,
    recentActivity,
    launchReadinessScore,
    engagementScore,
  });
});

export default router;
