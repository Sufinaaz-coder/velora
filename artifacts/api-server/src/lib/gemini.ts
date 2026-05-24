import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";
import crypto from "crypto";
import valkey from "./valkey";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export function hashKey(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

export async function generateWithCache<T>(
  cachePrefix: string,
  input: string,
  generateFn: () => Promise<T>
): Promise<{ result: T; fromCache: boolean; cacheKey: string }> {
  const cacheKey = `shelaunch:${cachePrefix}:${hashKey(input)}`;

  const cached = await valkey.get(cacheKey);
  if (cached) {
    valkey.recordCacheHit();
    logger.info({ cacheKey }, "Valkey cache hit");
    return { result: JSON.parse(cached) as T, fromCache: true, cacheKey };
  }

  valkey.recordCacheMiss();
  const result = await generateFn();
  await valkey.set(cacheKey, JSON.stringify(result), CACHE_TTL);
  logger.info({ cacheKey }, "Valkey cache miss — stored result");
  return { result, fromCache: false, cacheKey };
}

export async function generateBusinessLaunch(businessIdea: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert AI business consultant for women entrepreneurs in India. 
Generate comprehensive business launch content for this business idea: "${businessIdea}"

Respond ONLY with valid JSON in this exact structure:
{
  "businessNames": ["Name1", "Name2", "Name3", "Name4", "Name5"],
  "slogans": ["Slogan1", "Slogan2", "Slogan3"],
  "brandVoice": "Description of the brand voice and personality",
  "instagramBio": "Compelling Instagram bio under 150 chars",
  "targetAudience": "Detailed description of target audience",
  "pricingSuggestions": ["Price point 1 with context", "Price point 2", "Price point 3"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"],
  "launchStrategy": "Detailed 3-month launch strategy",
  "productIdeas": ["Product/service idea 1", "Product idea 2", "Product idea 3", "Product idea 4"],
  "whatsappDescription": "Professional WhatsApp Business description under 200 chars",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "marketingCaptions": ["Caption 1 for social media", "Caption 2", "Caption 3"],
  "packagingSuggestions": "Detailed packaging and presentation suggestions"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");

  return JSON.parse(jsonMatch[0]);
}

export async function generateCampaign(
  festival: string,
  tone: string,
  businessContext?: string | null
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contextPart = businessContext
    ? `The business context is: ${businessContext}.`
    : "";

  const prompt = `You are a creative marketing expert for women entrepreneurs in India.
Generate a complete ${festival} campaign with ${tone} tone. ${contextPart}

Respond ONLY with valid JSON in this exact structure:
{
  "offerIdeas": ["Offer 1", "Offer 2", "Offer 3", "Offer 4"],
  "captions": ["Caption 1", "Caption 2", "Caption 3"],
  "posterText": ["Poster text 1", "Poster text 2", "Poster text 3"],
  "reelIdeas": ["Reel idea 1", "Reel idea 2", "Reel idea 3"],
  "ctaCopy": ["CTA 1", "CTA 2", "CTA 3"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "whatsappPromos": ["WhatsApp promo 1", "WhatsApp promo 2", "WhatsApp promo 3"],
  "emailCampaign": "Complete email campaign copy with subject line and body"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");

  return JSON.parse(jsonMatch[0]);
}

export async function getSessionMemory(sessionId: string): Promise<string | null> {
  return valkey.hget(`shelaunch:session:${sessionId}`, "businessContext");
}

export async function setSessionMemory(sessionId: string, data: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(data)) {
    await valkey.hset(`shelaunch:session:${sessionId}`, key, value);
  }
  await valkey.expire(`shelaunch:session:${sessionId}`, 60 * 60 * 24); // 24 hours
}

export async function checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
  const key = `shelaunch:ratelimit:${identifier}`;
  const current = await valkey.incr(key);
  if (current === 1) {
    await valkey.expire(key, windowSeconds);
  }
  const remaining = Math.max(0, limit - current);
  return { allowed: current <= limit, remaining };
}

export const gemini = { genAI, generateBusinessLaunch, generateCampaign, generateWithCache };
export default gemini;
