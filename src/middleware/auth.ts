import { auth } from 'express-oauth2-jwt-bearer';

export const requireAuth = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: process.env.AUTH0_AUDIENCE,
});
