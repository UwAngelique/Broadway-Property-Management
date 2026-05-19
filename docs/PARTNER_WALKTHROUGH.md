# Broadway Property Management — Partner walkthrough

**Use this on staging** (Vercel URL), not localhost. Print to PDF: open in browser → Print → Save as PDF.

---

## 1. Marketing site

1. Open the staging home page.
2. Click **Pricing** — plans in **RWF**.
3. Click **About** and **Contact** — support details.
4. Click **Sign in**.

---

## 2. Landlord signup (optional if using demo)

1. **Sign up** → choose a plan (e.g. Professional).
2. Enter workspace name, email, password.
3. Land on **Departments** home with tiles (Properties, Units, Tenants, Leases, Payments, Tax).

**Demo shortcut:** `owner@demo-landlord.rw` / `Demo2026!` (after seed).

---

## 3. Setup guide (onboarding)

1. Sidebar → **Setup guide**.
2. Follow: Property (with **UPI**) → Units → Tenant invite → Lease upload → Rent reminder.

---

## 4. Properties & units

1. **Properties** — add building; note **UPI** field for Rwanda parcels.
2. **Units** — add Shop 1A under the building.

---

## 5. Tenants & leases

1. **Tenants** — create tenant login (can start inactive).
2. **Leases** — upload PDF, set rent in **RWF**, approve contract.

---

## 6. Payments (manual pilot)

1. **Settings** — confirm MoMo/bank proof toggles on.
2. Sign in as tenant (`tenant@demo-landlord.rw`) → **My portal** → **Pay rent**.
3. Paste MoMo SMS or upload screenshot → submit proof.
4. Sign back in as owner → **Payments** → **Approve** pending item.

**Banner:** “Manual payment pilot” — live APIs when banks/MoMo approve.

---

## 7. Tax & compliance PDF

1. Sidebar → **Tax**.
2. Read **Tracker only — not tax filing** banner (RRA link).
3. Add obligation row (e.g. VAT Q1).
4. **Export PDF** → share with accountant.

---

## 8. Platform operator (optional)

1. `platform@broadway.demo` / `Demo2026!`
2. **Clients** tile → list landlords → activate/suspend.
3. Rolled-up finance/tax counts on home tiles.

---

## What is not in this release

- Live MoMo/bank checkout (manual proof only)
- Live RRA filing API
- WhatsApp reminders (webhook env not set)
- Kinyarwanda/French UI (English first)

---

## Staging stack

- Frontend: Vercel  
- API: Render  
- Database: Neon  

See `DEPLOY_STAGING.md` for deploy steps.
