"use client";

import { io, type Socket } from "socket.io-client";
import { getToken } from "./auth";

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;

  const base =
    process.env.NEXT_PUBLIC_WS_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!socket) {
    socket = io(`${base.replace(/\/$/, "")}/events`, {
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
