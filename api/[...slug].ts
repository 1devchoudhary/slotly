import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/src/app';
import { connectToDatabase } from '../server/src/config/db';

/**
 * Vercel serverless entry point for the whole API.
 *
 * A catch-all (`[...slug]`) is used deliberately: Vercel's filesystem routing
 * would otherwise look for `api/auth/login.ts`, `api/admin/stats.ts` and so on.
 * Routing every `/api/*` request into this one function lets the existing
 * Express router stay the single source of truth — the same `app` that runs
 * locally and under test.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    await connectToDatabase();
  } catch (error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Database unavailable',
        detail:
          process.env.NODE_ENV === 'production'
            ? undefined
            : (error as Error).message,
      })
    );
    return;
  }

  // Express apps are just (req, res) handlers.
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res
  );
}
