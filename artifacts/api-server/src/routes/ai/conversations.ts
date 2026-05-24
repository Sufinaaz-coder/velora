import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { groq, MODEL } from "../../lib/groq";

const SYSTEM_PROMPT = `You are SheLaunch AI Assistant — a supportive, knowledgeable business advisor specifically for women entrepreneurs in India. You help with:
- Marketing strategies and social media tips
- Branding guidance and brand voice
- Pricing strategies for Indian markets
- Customer engagement techniques
- Launch checklists and planning
- Social media content calendar ideas
- Business growth suggestions
- Festival and seasonal campaign ideas

Keep responses concise, actionable, and encouraging. Understand Indian cultural context, festivals, and market nuances. Always be supportive and empowering.`;

const router = Router();

router.get("/ai/conversations", async (req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));
  res.json(conversations);
});

router.post("/ai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json(conversation);
});

router.get("/ai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conversation, messages });
});

router.delete("/ai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/ai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

router.post("/ai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  const allMessages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";

  try {
    const chatHistory = allMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: body.data.content },
      ],
      model: MODEL,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({
      conversationId: params.data.id,
      role: "assistant",
      content: fullResponse,
    });

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, params.data.id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI chat streaming failed");
    res.write(`data: ${JSON.stringify({ error: "AI generation failed", done: true })}\n\n`);
    res.end();
  }
});

export default router;
