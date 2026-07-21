import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { expressMiddleware } from "@as-integrations/express4";

import config from "./config/index.js";
import server, { context } from "./config/apollo.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { schema } from "./config/apollo.js";
import { initDatabase, closeDB, DatabaseType } from "./modules/shared/infrastructure/database/index.js";
import { HumanDurationVO } from "../../shared-domain/src/shared/value-objects/human-duration.vo.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  }),
);

app.use(
  rateLimit({
    windowMs: HumanDurationVO.create("15m"),
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  }),
);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

await server.start();

app.use(
  "/graphql",
  cors({ origin: config.corsOrigin, credentials: true }),
  express.json(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The Apollo Server v4 `expressMiddleware` type signature is wider than our `IContext`; bridging them is a known framework-integration limitation.
  expressMiddleware(server, { context: context as any }),
);

const dbConfigs = [
  {
    type: DatabaseType.MONGO,
    uri: config.database,
  },
];

console.warn("Initializing database connections via Facade...");
const dbResult = await initDatabase(dbConfigs);
if (dbResult.isFailure) {
  console.error("CRITICAL: Database initialization failed. Aborting startup.", dbResult.getError());
  process.exit(1);
}


const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `graphql-ws` passes an `extra` field that is `unknown`; casting to Express's `Request` is the documented integration pattern.
const serverCleanup = useServer({ schema, context: async (ctx) => { return context({ req: ctx.extra.request as any }); } }, wsServer);

const serverInstance = httpServer.listen(config.PORT, async () => {
  console.warn(`🚀 Server ready at http://localhost:${config.PORT}/graphql`);

  try {
    console.warn("Initializing WhatsApp Gateway...");
    const { containerInstance } = await import("./config/apollo-context.js");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Container is a Readonly<...> union, but at runtime we know the dynamic-imported module exposes `chat`. The dynamic import exists to break a circular dependency between `apollo.ts` and `apollo-context.ts`.
    const initResult = await (containerInstance as any).chat.initializeWhatsApp(undefined);
    if (initResult.isFailure) {
      console.error("Failed to initialize WhatsApp Gateway:", initResult.getError());
    } else {
      console.warn("✅ WhatsApp Gateway initialized successfully!");
    }
  } catch (error) {
    console.error("Failed to initialize WhatsApp Gateway during boot", error);
  }
});


const shutdown = async (signal: string) => {
  console.warn(`\n[Shutdown] ${signal} received. Starting graceful termination...`);

  // 1. Dispose GraphQL WS server subscription cleanup first
  try {
    console.warn("[Shutdown] Disposing GraphQL WS subscriptions server...");
    await serverCleanup.dispose();
  } catch (err) {
    console.error("[Shutdown] Error during GraphQL WS cleanup:", err);
  }

  // 2. Close Web Socket Server
  try {
    console.warn("[Shutdown] Closing WebSocket server...");
    wsServer.close();
  } catch (err) {
    console.error("[Shutdown] Error closing WebSocket server:", err);
  }

  // 3. Disconnect WhatsApp socket if active to release socket handles
  try {
    const { containerInstance } = await import("./config/apollo-context.js");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Container is a Readonly<...> union; same dynamic-import rationale as the init call above. Runtime-only access to the optional `whatsAppGateway` is intentional for graceful shutdown.
    const socket = (containerInstance as any).chat?.whatsAppGateway?.getSocket();
    if (socket) {
      console.warn("[Shutdown] WhatsApp gateway socket detected. Disconnecting...");
      socket.end(undefined);
    }
  } catch (err) {
    console.error("[Shutdown] Error disconnecting WhatsApp socket:", err);
  }

  // 4. Close DB connections
  try {
    console.warn("[Shutdown] Closing active database connections...");
    await closeDB();
  } catch (err) {
    console.error("[Shutdown] Error closing database:", err);
  }

  // 5. Close HTTP Server
  console.warn("[Shutdown] Closing HTTP server...");
  serverInstance.close(() => {
    console.warn("[Shutdown] HTTP server closed cleanly.");
    process.exit(0);
  });

  // 6. Enforce a 1.5s timeout for reloads/SIGINT to prevent tsx/concurrently hangs
  setTimeout(() => {
    console.warn("[Shutdown] Timeout reached. Forcing immediate clean process exit.");
    process.exit(0);
  }, 1500);
};

const signals = ["SIGINT", "SIGTERM"];
signals.forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});

const errors = ["uncaughtException", "unhandledRejection"];
errors.forEach((err) => {
  process.on(err, async (error: any) => {
    console.error(`${err} captured:`, error);
    await closeDB();
    process.exit(1);
  });
});
