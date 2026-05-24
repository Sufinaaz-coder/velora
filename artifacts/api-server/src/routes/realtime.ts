import { Router } from "express";
import valkey from "../lib/valkey";

const router = Router();

router.get("/realtime/stats", async (_req, res): Promise<void> => {
  const stats = await valkey.getStats();
  res.json(stats);
});

export default router;
