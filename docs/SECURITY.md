# Security (web + mobile)

## Authentication

- Access tokens expire in **15 minutes**; refresh tokens in **30 days** (hashed in the database).
- **Web:** tokens are in browser storage today; always use **HTTPS** in production and avoid untrusted browser extensions on admin machines.
- **Mobile:** tokens use **Expo SecureStore**; production builds use **HTTPS** API URLs (`eas.json` production profile).
- **Logout** calls `POST /api/auth/logout` to revoke the refresh token server-side, then clears local storage.

## Passwords

New passwords must be **at least 8 characters** with **a letter and a number**. Shown on signup and reset forms.

## Public signup

Public email signup only creates a **new landlord workspace** as **OWNER**. Clients cannot pick a role or join an existing account without an invite.

## API hardening

- Rate limits on login, signup, OTP, OAuth, refresh, and password reset.
- Strict request validation (`forbidNonWhitelisted`).
- Payment webhooks require `PAYMENT_WEBHOOK_SECRET` in production.
- CORS and WebSocket origins must be set via `CORS_ORIGINS` in production.

## Production checklist

1. Enable **HTTPS** (Certbot) and redirect HTTP → HTTPS in nginx.
2. Set strong `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PAYMENT_WEBHOOK_SECRET`.
3. Set `CORS_ORIGINS=https://broadwaycreation.rw,https://www.broadwaycreation.rw`.
4. Redeploy backend + frontend after env changes.

See also [SYNC_AND_I18N.md](./SYNC_AND_I18N.md) and [AUTH_SETUP.md](./AUTH_SETUP.md).
