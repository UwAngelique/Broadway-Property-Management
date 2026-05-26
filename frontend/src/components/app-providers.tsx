"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/i18n/language-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
