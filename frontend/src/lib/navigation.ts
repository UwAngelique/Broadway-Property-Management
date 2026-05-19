import type { SessionUser } from "./auth";

export type NavItem = { href: string; label: string; roles?: string[] };

export function navItemsFor(user: SessionUser): NavItem[] {
  if (user.role === "PLATFORM_OWNER") {
    return [
      { href: "/dashboard", label: "Home" },
      { href: "/dashboard/clients", label: "Clients" },
      { href: "/dashboard/payments", label: "Finance" },
      { href: "/dashboard/tax", label: "Tax" },
      { href: "/dashboard/operations", label: "Operations" },
      { href: "/dashboard/settings", label: "Settings" },
    ];
  }
  if (user.role === "TENANT") {
    return [
      { href: "/dashboard/portal", label: "My portal" },
      { href: "/dashboard/leases", label: "My lease" },
      { href: "/dashboard/portal/pay", label: "Pay rent" },
    ];
  }
  const items: NavItem[] = [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/onboarding", label: "Setup guide", roles: ["OWNER"] },
    { href: "/dashboard/properties", label: "Properties" },
    { href: "/dashboard/units", label: "Units" },
    { href: "/dashboard/tenants", label: "Tenants" },
    { href: "/dashboard/leases", label: "Leases" },
    { href: "/dashboard/payments", label: "Payments" },
    { href: "/dashboard/tax", label: "Tax" },
    { href: "/dashboard/expenses", label: "Expenses", roles: ["OWNER", "ACCOUNTANT"] },
    { href: "/dashboard/forecast", label: "Annual forecast" },
    { href: "/dashboard/operations", label: "Operations" },
    { href: "/dashboard/team", label: "Team", roles: ["OWNER"] },
    { href: "/dashboard/settings", label: "Settings" },
  ];
  return items.filter((i) => !i.roles || i.roles.includes(user.role));
}
