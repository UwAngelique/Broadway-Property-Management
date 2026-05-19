"use client";

import { DashboardChrome } from "./dashboard-chrome";
import { useSession } from "./use-session";

export function DashboardPage({ title, children }: { title: string; children: React.ReactNode }) {
  const { user } = useSession();
  if (!user) return null;
  return <DashboardChrome user={user} title={title}>{children}</DashboardChrome>;
}

