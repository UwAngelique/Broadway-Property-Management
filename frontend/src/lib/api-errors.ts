/** Turn Nest/API error bodies into short, user-friendly messages. */
export function parseApiError(body: string, status?: number): string {
  if (body) {
    try {
      const json = JSON.parse(body) as { message?: string | string[] };
      if (Array.isArray(json.message)) return json.message.join(". ");
      if (typeof json.message === "string" && json.message.length > 0) return json.message;
    } catch {
      const trimmed = body.trim();
      if (/^internal server error$/i.test(trimmed)) {
        return "Something went wrong on our side. Please try again shortly.";
      }
      if (trimmed.length < 180 && !trimmed.startsWith("{")) return trimmed;
    }
  }

  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you requested.";
  if (status === 409) return "This record already exists.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status && status >= 500) return "Something went wrong on our side. Please try again shortly.";

  return "Something went wrong. Please try again.";
}
