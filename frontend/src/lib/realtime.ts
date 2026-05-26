"use client";

import { io, type Socket } from "socket.io-client";
import { getToken } from "./auth";
import { getWebSocketOrigin } from "./ws-base";

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;

  const base = getWebSocketOrigin();

  if (!socket) {
    socket = io(`${base}/events`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
  }
  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
