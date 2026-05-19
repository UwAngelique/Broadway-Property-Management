/**
 * Single source of truth for subscription tiers shown at signup and in billing API.
 * Prices are illustrative RWF/month for Rwanda — adjust before go-live.
 */

export type SubscriptionPlan = {
  id: string;
  name: string;
  tagline: string;
  priceRwfMonthly: number | null;
  priceLabel: string;
  billingNote: string;
  idealFor: string;
  features: string[];
  limits: { label: string; value: string }[];
  highlighted?: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Solo landlords getting digital',
    priceRwfMonthly: 35_000,
    priceLabel: '35,000 RWF / month',
    billingNote: 'Billed monthly. VAT may apply. Annual prepay: ~2 months free (negotiated).',
    idealFor: '1 owner, up to ~25 units, one building or small portfolio.',
    features: [
      'Core property & unit registry (buildings, land parcels, UPI fields)',
      'Tenant profiles & contracts (upload, versions, approvals)',
      'Rent reminders & VAT-inclusive invoice PDFs (RWF)',
      'Payment proof upload & EBM / purchase-code workflow (manual bank / MoMo toggles)',
      'Basic landlord dashboard (occupancy, collections, vacancy loss)',
      'Audit trail for document view / download / upload / edit',
      'Email notifications (SMTP); WhatsApp webhook hooks',
      '2 team seats (owner + 1 role: accountant OR lawyer OR tenant manager)',
    ],
    limits: [
      { label: 'Units (approx.)', value: 'Up to 25' },
      { label: 'Included seats', value: '2' },
      { label: 'Support', value: 'Email (48h)' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Growing portfolios & compliance',
    priceRwfMonthly: 95_000,
    priceLabel: '95,000 RWF / month',
    billingNote: 'Billed monthly. Optional quarterly reviews with your accountant.',
    idealFor: 'Active landlords with commercial + residential mix and an accountant.',
    features: [
      'Everything in Starter',
      'Advanced analytics (revenue trend, building performance, rolled-up KPIs)',
      'Expense & cashflow summaries',
      'Rwanda tax profile + obligation register (VAT, land/property, PIT/CIT trackers)',
      'PDF export of tax obligation register for RRA prep',
      'Up to 8 team seats (owner, accountant, lawyer, tenants)',
      'Priority email support (24h target)',
    ],
    limits: [
      { label: 'Units (approx.)', value: 'Up to 120' },
      { label: 'Included seats', value: '8' },
      { label: 'Support', value: 'Email priority' },
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Multi-site operators & property managers',
    priceRwfMonthly: 185_000,
    priceLabel: '185,000 RWF / month',
    billingNote: 'Annual contracts common; onboarding fee may apply for data migration.',
    idealFor: 'Property management firms or owners with many buildings and lands.',
    features: [
      'Everything in Professional',
      'Higher default limits (units & seats) — exact caps in your MSA',
      'Platform operator features if you resell under your brand (add-on)',
      'Bulk onboarding assistance (spreadsheet import — phased)',
      'Named support contact (business hours Kigali)',
    ],
    limits: [
      { label: 'Units (approx.)', value: 'Up to 400' },
      { label: 'Included seats', value: '20' },
      { label: 'Support', value: 'Named contact' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom SLA, integrations, white-label',
    priceRwfMonthly: null,
    priceLabel: 'Custom (from ~450,000 RWF / month)',
    billingNote: 'MSA, SLA, optional revenue share for payment facilitation. Contact sales.',
    idealFor: 'Banks, large REITs, insurers, or government-linked housing programs.',
    features: [
      'Everything in Business',
      'Custom integrations (core banking, ERP, RRA e-filing when available)',
      'Dedicated environment option',
      '24/7 or extended-hours support as agreed',
      'Legal review pack for data residency & DP law alignment',
    ],
    limits: [
      { label: 'Units', value: 'Custom' },
      { label: 'Seats', value: 'Custom' },
      { label: 'Support', value: 'SLA-based' },
    ],
  },
  {
    id: 'platform_partner',
    name: 'Platform Partner',
    tagline: 'You operate Broadway for your landlord clients',
    priceRwfMonthly: null,
    priceLabel: 'Per active landlord workspace + revenue share options',
    billingNote: 'You bill your clients; we bill you. Activation & suspend tools included.',
    idealFor: 'Broadway as B2B2B: you are the SaaS operator; clients are property owners.',
    features: [
      'PLATFORM_OWNER role & multi-tenant client workspaces',
      'Client activation / hold / suspend',
      'Rolled-up analytics across all landlord clients',
      'Co-branding options (add-on)',
    ],
    limits: [
      { label: 'Landlord clients', value: 'Tiered' },
      { label: 'Support', value: 'Partner success manager' },
    ],
  },
];

export const SUBSCRIPTION_PLAN_IDS = SUBSCRIPTION_PLANS.map((p) => p.id);

export function isValidSubscriptionPlanId(id: string): boolean {
  return SUBSCRIPTION_PLAN_IDS.includes(id);
}
