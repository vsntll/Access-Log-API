import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

export const checkJwt = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: process.env.AUTH0_AUDIENCE,
});

export function requireScope(scope: string) {
  return [checkJwt, requiredScopes(scope)];
}
