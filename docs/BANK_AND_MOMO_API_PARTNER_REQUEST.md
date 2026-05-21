# Broadway Property Management — API & Payment Partnership Request

**Confidential — for bank, mobile money operator, and payment aggregator discussions**  
**Date:** May 2026  
**Company / product:** Broadway Property Management (Rwanda property SaaS)  
**Technical contact:** [Your name, email, phone]  
**Repository (private demo available on request):** Broadway-Property-Management

---

## 1. Purpose of this document

Broadway Property Management is preparing to integrate **official payment and settlement APIs** so landlords can collect rent digitally and the platform can **reconcile tenant payments** against bank and mobile-money statements.

We request a **technical partnership meeting** and access to **sandbox / UAT APIs** with your institution.

**Important:** Our platform is **not yet connected** to any live bank or MoMo API. This document describes **what we have built**, **what we need from you**, and **how integration would work**.

---

## 2. About Broadway (one paragraph for executives)

Broadway is a cloud property-management platform for **Rwanda landlords, property managers, and tenants**. It manages buildings (including **UPI** land references), units, leases, rent invoices, tax obligation tracking (RRA prep), and payment proof workflows. We sell subscription plans from **35,000 RWF/month** (Starter) to enterprise custom pricing, and support **platform partners** who resell the product to multiple landlord clients.

**Current payment model (MVP):** Tenants upload **manual proof** (MoMo SMS screenshot or bank transfer reference); landlords approve in the dashboard.  
**Target model:** Live **checkout / collect** APIs + **webhooks** + **statement reconciliation**.

---

## 3. What we have already built (technical readiness on our side)

| Item | Status |
|------|--------|
| REST API (NestJS, PostgreSQL) | Production-oriented MVP |
| Payment entity: methods `BANK_TRANSFER`, `BANK_GATEWAY`, `MTN_MOMO`, `AIRTEL_MONEY`, `CASH` | Done |
| Landlord payment settings (toggle MoMo/bank/gateway) | Done |
| Tenant proof upload (image/PDF) | Done |
| Owner approve/reject workflow | Done |
| Gateway adapter interface (`PaymentGatewayService`) | Done — **awaiting your API** |
| Webhook endpoint stub `POST /payments/webhooks/provider` | Done — will add HMAC verification |
| Rwanda commercial bank name reference list | Static catalog in code |
| Invoice PDF generation | Done |
| Multi-tenant landlord workspaces | Done |

We can complete integration in **6–10 weeks** after sandbox credentials and API documentation are provided.

---

## 4. What we are requesting from your institution

### 4.1 For banks (BK, BPR, Equity, I&M, Ecobank, KCB, GT Bank, Access, NCBA, etc.)

| # | Request | Why we need it |
|---|---------|----------------|
| 1 | **Merchant / aggregator API** documentation (collections, status query) | Tenant rent collection |
| 2 | **Sandbox / UAT** environment + test accounts | Safe development |
| 3 | **Webhook specification** (payment success, failure, reversal) | Update invoice status automatically |
| 4 | **Statement or transaction export API** (or SFTP CSV spec) | Reconcile proof vs actual credit |
| 5 | **OAuth / API key** onboarding process and compliance checklist | KYC for Broadway as merchant |
| 6 | **Fee schedule** (per transaction, monthly) | Pricing for landlords |
| 7 | **Settlement timing** (T+0, T+1) | Cashflow forecasting feature |
| 8 | Named **technical contact** at bank | Integration support |

### 4.2 For MTN MoMo (Rwanda)

| # | Request |
|---|---------|
| 1 | **MoMo Collections API** (Request to Pay / Collect) documentation |
| 2 | Sandbox merchant ID and API user |
| 3 | Callback URL registration process |
| 4 | Transaction status query API |
| 5 | Dispute / reversal handling guide |
| 6 | Commercial terms for property-management sector |

### 4.3 For Airtel Money (Rwanda)

| # | Request |
|---|---------|
| 1 | **Airtel Money merchant / collections API** documentation |
| 2 | Sandbox credentials |
| 3 | Webhook / callback specification |
| 4 | Statement or reconciliation file format |

---

## 5. Proposed integration architecture

```
Tenant (MoMo / bank app)
        │
        ▼
[Your institution API] ──webhook──► Broadway API (NestJS)
        │                              │
        │                              ├── Update Payment status
        │                              ├── Mark Invoice PAID
        │                              └── Notify landlord (email/WhatsApp)
        │
        ▼
Settlement to landlord designated account (per your rules)
```

**Security commitments from Broadway:**

- TLS 1.2+ on all endpoints
- Webhook signature verification (HMAC / JWT per your spec)
- No storage of full card PAN (if applicable)
- Secrets in encrypted environment variables
- Audit log of payment state changes
- Data processing aligned with Rwanda Law No. 058/2021 on personal data

---

## 6. Use cases we will enable (post-integration)

1. **Tenant pays rent** from portal via MoMo or bank redirect — instant status.
2. **Landlord dashboard** shows collected vs outstanding per building/unit.
3. **Reconciliation job** matches your settlement file to open invoices (Phase 2: OCR on uploaded statements).
4. **Platform operator** sees rolled-up collections across multiple landlord clients.
5. **Optional:** Broadway subscription fee collection via same rail (SaaS billing).

---

## 7. Volume projections (for your risk team)

| Phase | Timeline | Tenants / transactions |
|-------|----------|------------------------|
| Pilot | Months 1–3 | 50–200 tenants; low hundreds of tx/month |
| Growth | Months 4–12 | 2,000+ tenants; thousands of tx/month |
| Scale | Year 2+ | Negotiate enterprise pricing |

*Figures are estimates for sandbox approval — we will provide updated forecasts before production go-live.*

---

## 8. Compliance & business documents we can provide

- Company registration (RDB)
- Tax identification (TIN)
- Director ID / beneficial ownership (on request)
- Privacy policy and terms of use (hosted on production URL)
- Technical security overview (this document + DEVELOPER_HANDOFF)
- Demo environment walkthrough (video or live session)

---

## 9. FAQ for partner technical teams

**Q: Are APIs already live in production?**  
A: No. We use manual proof upload today. Gateway service returns a placeholder until your sandbox is connected.

**Q: Do you store MoMo PINs?**  
A: No. We never ask for PINs. We use your hosted checkout or USSD push per your API.

**Q: Do you support split settlement to multiple landlords?**  
A: Planned via `accountId` per payment; we need your guidance on sub-merchant or aggregator models.

**Q: Currency?**  
A: RWF only for MVP.

---

## 10. Meeting ask

We request a **60-minute technical workshop** covering:

1. Sandbox access process and timeline  
2. Webhook and idempotency requirements  
3. Reconciliation file format  
4. Go-live certification checklist  
5. Commercial contact for MoU  

**Suggested attendees (Broadway):** Founder, lead developer  
**Suggested attendees (Partner):** API product manager, integration engineer, compliance

---

## 11. Contact

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Founder / CEO | [Fill in] | [Fill in] | [Fill in] |
| Technical lead | [Fill in] | [Fill in] | [Fill in] |

---

*Broadway Property Management — Kigali, Rwanda. Document version 1.0.*
