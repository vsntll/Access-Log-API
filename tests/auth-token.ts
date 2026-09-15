export async function getAccessToken(scope?: string): Promise<string | null> {
  const { AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } =
    process.env;

  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
    return null;
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: AUTH0_AUDIENCE,
      ...(scope ? { scope } : {}),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.access_token as string;
}

export function tokenScopes(token: string): string[] {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return (payload.permissions ?? payload.scope?.split(' ')) ?? [];
}
