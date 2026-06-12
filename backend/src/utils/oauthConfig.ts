/** OAuth env vars must not be the literal strings "undefined"/"null" (Node process.env quirk). */
export function getOAuthEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value === 'undefined' || value === 'null') return undefined;
  return value;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getOAuthEnv('GOOGLE_CLIENT_ID') && getOAuthEnv('GOOGLE_CLIENT_SECRET'));
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(getOAuthEnv('GITHUB_CLIENT_ID') && getOAuthEnv('GITHUB_CLIENT_SECRET'));
}

export function oauthSetupHtml(provider: 'google' | 'github', siteUrl: string): string {
  const callback =
    provider === 'google'
      ? `${siteUrl}/auth/google/callback`
      : `${siteUrl}/auth/github/callback`;
  const consoleUrl =
    provider === 'google'
      ? 'https://console.cloud.google.com/apis/credentials'
      : 'https://github.com/settings/developers';
  const label = provider === 'google' ? 'Google' : 'GitHub';
  const prefix = provider === 'google' ? 'GOOGLE' : 'GITHUB';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${label} sign-in not configured</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
  </style>
</head>
<body>
  <h1>${label} sign-in is not configured yet</h1>
  <p>OAuth credentials are missing on this deployment. Set them once, then sign-in will work.</p>
  <ol>
    <li>Create an OAuth app in the <a href="${consoleUrl}">${label} developer console</a>.</li>
    <li>Add redirect URI: <code>${callback}</code></li>
    <li>From <code>mr-brij/worker</code>, run:
      <pre>cd worker
npx wrangler secret put ${prefix}_CLIENT_ID
npx wrangler secret put ${prefix}_CLIENT_SECRET
npm run deploy</pre>
    </li>
  </ol>
  <p><a href="/">← Back to site</a></p>
</body>
</html>`;
}
