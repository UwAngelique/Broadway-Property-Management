import { getApiUrl } from "./config";

/** Socket.IO is served at site root `/events`, not under `/api`. */
export function getWebSocketOrigin(): string {
  const api = getApiUrl().replace(/\/$/, "");
  try {
    const url = new URL(api);
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    return `${url.origin}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return api.replace(/\/api\/?$/, "");
  }
}
