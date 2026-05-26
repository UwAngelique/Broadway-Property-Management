import { io, Socket } from "socket.io-client";
import { getWebSocketOrigin } from "./ws";

let socket: Socket | null = null;

export function connectRealtime(token: string, onRefresh: () => void) {
  if (socket) socket.disconnect();
  socket = io(`${getWebSocketOrigin()}/events`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  socket.on("sync:refresh", onRefresh);
  socket.on("payment:updated", onRefresh);
  socket.on("invoice:updated", onRefresh);
}
