/** WebSocket/Socket.IO origin — nginx serves `/events` at site root, not under `/api`. */
export function getWebSocketOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined" && (!api || api.startsWith("/"))) {
    return window.location.origin;
  }

  if (api) {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const url = new URL(api, base);
      url.pathname = url.pathname.replace(/\/api\/?$/, "");
      return `${url.origin}${url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "")}`;
    } catch {
      /* fall through */
    }
  }

  return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
}
