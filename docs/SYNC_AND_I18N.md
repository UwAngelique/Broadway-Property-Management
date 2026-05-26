# Data sync and languages

## 60-second sync (web + mobile)

Authenticated clients call **`GET /api/sync/pull?revision=<last>`** every **60 seconds** (and immediately on WebSocket events).

- If the server revision matches `revision`, the response is lightweight (`unchanged: true`).
- Otherwise the response includes fresh dashboard hub data, the user’s language, and (for platform owners) platform overview.
- Payment and invoice changes also emit **`sync:refresh`** on the account WebSocket room.

Web: `SyncProvider` in the dashboard layout. Mobile: `HubScreen` polls `/sync/pull` on the same interval.

Socket.IO endpoint: **`/events`** at the site origin (not under `/api`). Set `NEXT_PUBLIC_WS_URL` if your proxy differs.

## Languages

Supported API codes: **EN, FR, RW, SW, ES, NL, ZH** (English, French, Kinyarwanda, Swahili, Spanish, Dutch, Chinese).

- UI strings live in `shared/i18n/messages.ts`.
- Users change language in the header switcher (web) or Settings (mobile).
- Preference is saved locally and via **`PATCH /api/auth/me/language`** when signed in.
