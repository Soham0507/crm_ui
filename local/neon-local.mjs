// Preloaded by `npm run local`. The app talks to its database with the Neon
// driver, which speaks Postgres over a WebSocket. A plain local Postgres does
// not, so this relays those WebSocket bytes to it over TCP.
import net from "node:net";
import { neonConfig } from "@neondatabase/serverless";
import { WebSocketServer, createWebSocketStream } from "ws";

const database = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(database.hostname)) {
  throw new Error("local/neon-local.mjs only works with a database on this computer");
}

const relay = new WebSocketServer({
  host: "127.0.0.1",
  port: 0,
  // Browsers always send an Origin header; the database driver does not.
  verifyClient: ({ req }) => !req.headers.origin,
});

relay.on("connection", (socket) => {
  const client = createWebSocketStream(socket);
  const server = net.connect(Number(database.port), database.hostname);
  const close = () => {
    client.destroy();
    server.destroy();
  };
  client.on("error", close).on("close", close);
  server.on("error", close).on("close", close);
  client.pipe(server);
  server.pipe(client);
});

await new Promise((resolve, reject) => {
  relay.once("listening", resolve).once("error", reject);
});

neonConfig.wsProxy = () => `127.0.0.1:${relay.address().port}/`;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;
