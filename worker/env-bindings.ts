/** Copy Worker bindings into process.env without coercing undefined to the string "undefined". */
export function syncProcessEnvFromBindings(env: Env): void {
  const pairs: Array<[keyof Env, string]> = [
    ['ADMIN_EMAILS', 'ADMIN_EMAILS'],
    ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID'],
    ['GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'],
    ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_ID'],
    ['GITHUB_CLIENT_SECRET', 'GITHUB_CLIENT_SECRET'],
  ];

  for (const [bindingKey, envKey] of pairs) {
    const value = env[bindingKey];
    if (typeof value === 'string' && value.length > 0) {
      process.env[envKey] = value;
    } else {
      delete process.env[envKey];
    }
  }

  if (!process.env.ADMIN_EMAILS) {
    process.env.ADMIN_EMAILS = 'bps.brijendra@gmail.com';
  }
}
