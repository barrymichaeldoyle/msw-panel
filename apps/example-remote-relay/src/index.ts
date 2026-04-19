import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";

import { WebSocket as WsSocket, WebSocketServer } from "ws";
import type { RawData } from "ws";

const port = Number(process.env.PORT ?? 4197);
const httpServer = createServer();
const webSocketServer = new WebSocketServer({ server: httpServer });
const sessions = new Map<string, Set<WsSocket>>();

webSocketServer.on("connection", (socket: WsSocket, request: IncomingMessage) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const sessionId = requestUrl.searchParams.get("session") ?? "example-react";
  const sessionSockets = sessions.get(sessionId) ?? new Set<WsSocket>();

  sessionSockets.add(socket);
  sessions.set(sessionId, sessionSockets);

  socket.send(
    JSON.stringify({
      event: "relay:connected",
      sessionId,
      peers: sessionSockets.size,
    }),
  );

  socket.on("message", (message: RawData, isBinary: boolean) => {
    const payload = isBinary ? message : message.toString();

    for (const peer of sessionSockets) {
      if (peer !== socket && peer.readyState === WsSocket.OPEN) {
        peer.send(payload);
      }
    }
  });

  socket.on("close", () => {
    sessionSockets.delete(socket);

    if (sessionSockets.size === 0) {
      sessions.delete(sessionId);
      return;
    }

    for (const peer of sessionSockets) {
      if (peer.readyState === WsSocket.OPEN) {
        peer.send(
          JSON.stringify({
            event: "relay:peer-left",
            sessionId,
            peers: sessionSockets.size,
          }),
        );
      }
    }
  });
});

httpServer.listen(port, () => {
  console.log(`msw-panel relay listening on ws://localhost:${port}?session=example-react`);
});

const shutdown = () => {
  webSocketServer.close();
  httpServer.close();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
