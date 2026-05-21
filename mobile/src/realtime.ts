import { io, Socket } from "socket.io-client";
import { getApiUrl } from "./api";

let socket: Socket | null = null;

export function connectRealtime(token: string, onRefresh: () => void) {
  if (socket) socket.disconnect();
  socket = io(`${getApiUrl()}/events`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  socket.on("payment:updated", onRefresh);
  socket.on("invoice:updated", onRefresh);
}
