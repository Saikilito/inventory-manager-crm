import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { expressMiddleware } from "@as-integrations/express4";

import config from "./config/index.js";
import server, { context } from "./config/apollo.js";
import { closeDB } from "./config/db-connection.js";
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
  expressMiddleware(server, { context: context as any }),
);

const { default: db } = await import("./config/db-connection.js");

const serverInstance = app.listen(config.PORT, () => {
  db();
  console.warn(`🚀 Server ready at http://localhost:${config.PORT}/graphql`);
});

const shutdown = async (signal: string) => {
  console.warn(`\n${signal} received, closing server...`);
  serverInstance.close(async () => {
    await closeDB();
    console.warn("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, HumanDurationVO.create("10s"));
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
