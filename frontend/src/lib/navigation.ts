import type { TranslationKey } from "@/i18n";
import type { SessionUser } from "./auth";

export type NavItem = { href: string; labelKey: TranslationKey; roles?: string[] };

export function navItemsFor(user: SessionUser): NavItem[] {
  if (user.role === "PLATFORM_OWNER") {
    return [
      { href: "/dashboard", labelKey: "nav.home" },
      { href: "/dashboard/clients", labelKey: "nav.clients" },
      { href: "/dashboard/payments", labelKey: "nav.finance" },
      { href: "/dashboard/tax", labelKey: "nav.tax" },
      { href: "/dashboard/operations", labelKey: "nav.operations" },
      { href: "/dashboard/settings", labelKey: "nav.settings" },
    ];
  }
  if (user.role === "TENANT") {
    return [
      { href: "/dashboard/portal", labelKey: "nav.portal" },
      { href: "/dashboard/leases", labelKey: "nav.leases" },
      { href: "/dashboard/portal/pay", labelKey: "nav.pay" },
    ];
  }
  const items: NavItem[] = [
    { href: "/dashboard", labelKey: "nav.home" },
    { href: "/dashboard/onboarding", labelKey: "nav.setup", roles: ["OWNER"] },
    { href: "/dashboard/properties", labelKey: "nav.properties" },
    { href: "/dashboard/units", labelKey: "nav.units" },
    { href: "/dashboard/tenants", labelKey: "nav.tenants" },
    { href: "/dashboard/leases", labelKey: "nav.leases" },
    { href: "/dashboard/payments", labelKey: "nav.payments" },
    { href: "/dashboard/tax", labelKey: "nav.tax" },
    { href: "/dashboard/expenses", labelKey: "nav.expenses", roles: ["OWNER", "ACCOUNTANT"] },
    { href: "/dashboard/forecast", labelKey: "nav.forecast" },
    { href: "/dashboard/operations", labelKey: "nav.operations" },
    { href: "/dashboard/team", labelKey: "nav.team", roles: ["OWNER"] },
    { href: "/dashboard/settings", labelKey: "nav.settings" },
  ];
  return items.filter((i) => !i.roles || i.roles.includes(user.role));
}
