import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedGenerationsTable = pgTable("saved_generations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'business' | 'campaign'
  title: text("title").notNull(),
  content: text("content").notNull(), // JSON string of the result
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedGenerationSchema = createInsertSchema(savedGenerationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedGeneration = z.infer<typeof insertSavedGenerationSchema>;
export type SavedGeneration = typeof savedGenerationsTable.$inferSelect;
