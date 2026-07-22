import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/src/app';
import { connectToDatabase } from '../server/src/config/db';

/**
 * Vercel serverless entry point for the whole API.
 *
 * Every `/api/*` request is rewritten into this single function (see
 * vercel.json) so the Express router stays the single source of truth — the
 * same `app` that runs locally and under test.
 *
 * An `api/[...slug].ts` catch-all was tried first and only matched
 * single-segment paths: `/api/health` reached the function while
 * `/api/admin/stats` returned a platform 404 without ever invoking it. An
 * explicit rewrite is unambiguous.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Express matches on req.url, which must still carry the /api prefix its
  // routers are mounted under. A rewrite preserves the original path; restore
  // it defensively in case the platform hands over the rewritten one instead.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }

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
