/** Used when /billing/plans API is unreachable (backend down or CORS). */
export const FALLBACK_PLANS_RESPONSE = {
  currency: "RWF",
  disclaimer:
    "Prices are indicative for Rwanda. Final pricing, VAT, and contracts are confirmed at onboarding.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      tagline: "Solo landlords getting digital",
      priceRwfMonthly: 35000,
      priceLabel: "35,000 RWF / month",
      billingNote: "Billed monthly. VAT may apply.",
      idealFor: "1 owner, up to ~25 units.",
      features: ["Properties & UPI", "Leases & invoices", "Manual MoMo/bank proof", "Basic dashboard"],
      limits: [{ label: "Units", value: "Up to 25" }],
    },
    {
      id: "professional",
      name: "Professional",
      tagline: "Growing portfolios & compliance",
      priceRwfMonthly: 95000,
      priceLabel: "95,000 RWF / month",
      billingNote: "Billed monthly.",
      idealFor: "Active landlords with accountant.",
      features: ["Everything in Starter", "Tax register", "Team seats", "Annual forecast"],
      limits: [{ label: "Units", value: "Up to 120" }],
      highlighted: true,
    },
    {
      id: "business",
      name: "Business",
      tagline: "Multi-site operators",
      priceRwfMonthly: 185000,
      priceLabel: "185,000 RWF / month",
      billingNote: "Annual contracts common.",
      idealFor: "Property managers.",
      features: ["Everything in Professional", "Higher limits", "Priority support"],
      limits: [{ label: "Units", value: "Up to 400" }],
    },
  ],
};
