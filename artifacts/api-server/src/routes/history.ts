import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, savedGenerationsTable } from "@workspace/db";
import { SaveGenerationBody, DeleteGenerationParams } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/history", async (_req, res): Promise<void> => {
  const generations = await db
    .select()
    .from(savedGenerationsTable)
    .orderBy(desc(savedGenerationsTable.createdAt));
  res.json(generations);
});

router.post("/history", async (req, res): Promise<void> => {
  const parsed = SaveGenerationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(savedGenerationsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(saved);
});

router.delete("/history/:id", async (req, res): Promise<void> => {
  const params = DeleteGenerationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(savedGenerationsTable)
    .where(eq(savedGenerationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Generation not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
