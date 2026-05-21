/**
 * Validates required environment variables at startup (production/staging).
 */
export function validateProductionEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGINS',
    'APP_URL',
  ];

  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`);
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const v = process.env[key] ?? '';
    if (v.length < 32 || v.includes('change') || v.includes('dev-secret')) {
      throw new Error(`${key} must be a strong random string (32+ chars) in production`);
    }
  }

  if (process.env.DB_SYNCHRONIZE !== 'false') {
    throw new Error('DB_SYNCHRONIZE must be "false" in production — use migrations');
  }
}
