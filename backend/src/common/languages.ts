export const USER_LANGUAGES = ['EN', 'FR', 'RW', 'SW', 'ES', 'NL', 'ZH'] as const;
export type UserLanguage = (typeof USER_LANGUAGES)[number];

export function isUserLanguage(v: string): v is UserLanguage {
  return (USER_LANGUAGES as readonly string[]).includes(v);
}
