import express from "express";
import cors from "cors";
import { expressMiddleware } from "@as-integrations/express4";
import server, { context } from "./config/apollo.js";
import config from "./config/index.js";
import { closeDB } from "./config/db-connection.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

await server.start();
app.use(
  "/graphql",
  cors({ origin: "http://localhost:3000", credentials: true }),
  express.json(),
  expressMiddleware(server, { context }),
);

const { default: db } = await import("./config/db-connection.js");

const serverInstance = app.listen(config.PORT, () => {
  db();
  console.warn(`🚀 Server ready at http://localhost:${config.PORT}/graphql`);
});

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.warn(`\n${signal} recibido, cerrando servidor...`);
  serverInstance.close(async () => {
    await closeDB();
    console.warn("Servidor cerrado");
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error("Forzando cierre tras timeout");
    process.exit(1);
  }, 10000);
};

const signals = ["SIGINT", "SIGTERM"];
signals.forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});

const errors = ["uncaughtException", "unhandledRejection"];
errors.forEach((err) => {
  process.on(err, async (error) => {
    console.error(`${err} capturado:`, error);
    await closeDB();
    process.exit(1);
  });
});
