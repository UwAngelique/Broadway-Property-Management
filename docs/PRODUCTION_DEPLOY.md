# Production deployment checklist

## DigitalOcean backend

```env
NODE_ENV=production
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
DB_SSL=true

DB_HOST=${broadway_pm.HOSTNAME}
DB_PORT=${broadway_pm.PORT}
DB_USERNAME=${broadway_pm.USERNAME}
DB_PASSWORD=${broadway_pm.PASSWORD}
DB_NAME=${broadway_pm.DATABASE}

JWT_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
CORS_ORIGINS=https://your-app.vercel.app
APP_URL=https://your-api.ondigitalocean.app

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-key>
SMTP_FROM=noreply@yourdomain.com

AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=<key>

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...

PAYMENT_WEBHOOK_SECRET=<random>
```

Build: `npm install && npm run build`  
Run: `npm run start:prod`

## Vercel frontend

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.ondigitalocean.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same-as-backend>
NEXT_PUBLIC_WS_URL=https://your-api.ondigitalocean.app
```

## After deploy

1. Run migration: `npm run migration:run` (or enable `DB_MIGRATIONS_RUN=true` once)
2. Seed: `node scripts/seed-demo-staging.js`
3. Configure Stripe webhook: `POST /billing/webhooks/stripe`
4. Test phone OTP: `POST /auth/phone/request-otp`
