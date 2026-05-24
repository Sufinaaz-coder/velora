import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { logger } from "./logger";
import valkey from "./valkey";

let io: SocketServer | null = null;

export function initSocketIO(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket.io client connected");

    socket.on("subscribe:trending", () => {
      socket.join("trending");
    });

    socket.on("subscribe:analytics", () => {
      socket.join("analytics");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket.io client disconnected");
    });
  });

  setInterval(async () => {
    if (!io) return;
    try {
      const stats = await valkey.getStats();
      io.to("analytics").emit("stats:update", stats);
    } catch (_) {}
  }, 3000);

  setInterval(async () => {
    if (!io) return;
    try {
      const raw = await valkey.zrevrange("shelaunch:trending:niches", 0, 9);
      const trending = raw.map(({ member, score }, index) => ({
        name: member,
        count: Math.round(score),
        trend: index < 3 ? "up" : "stable",
        emoji: getNicheEmoji(member),
      }));
      if (trending.length > 0) {
        io.to("trending").emit("trending:update", trending);
      }
    } catch (_) {}
  }, 5000);

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitTrendingUpdate(data: unknown) {
  if (io) {
    io.to("trending").emit("trending:update", data);
  }
}

function getNicheEmoji(niche: string): string {
  const lower = niche.toLowerCase();
  if (lower.includes("jewelry") || lower.includes("jewellery")) return "💎";
  if (lower.includes("skin") || lower.includes("beauty")) return "✨";
  if (lower.includes("bak") || lower.includes("food")) return "🍰";
  if (lower.includes("fashion") || lower.includes("cloth")) return "👗";
  if (lower.includes("mehendi") || lower.includes("henna")) return "🌿";
  if (lower.includes("candle") || lower.includes("craft")) return "🕯️";
  if (lower.includes("yoga") || lower.includes("wellness")) return "🧘";
  if (lower.includes("art") || lower.includes("paint")) return "🎨";
  if (lower.includes("plant") || lower.includes("garden")) return "🌱";
  if (lower.includes("soap") || lower.includes("organic")) return "🌸";
  return "🚀";
}
