import mongoose from "mongoose";

/**
 * Long-running process (local dev, a container, Render). Failing to reach the
 * database at boot is unrecoverable, so exit and let the supervisor restart us.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Serverless (Vercel). Each invocation may reuse a warm container, so the
 * connection — and the in-flight *promise*, to stop a burst of cold starts from
 * each opening their own — is cached on globalThis, which survives between
 * invocations while module state may not.
 *
 * Never exits the process: a serverless function must return an error response,
 * not kill its own container.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};
globalWithMongoose.__mongooseCache = cache;

export const connectToDatabase = async () => {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        // Fail fast instead of buffering queries until the function times out.
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        // Serverless fans out across many containers; keep each pool small.
        maxPoolSize: 5,
      })
      .catch((error) => {
        // Clear the failed promise so the next request retries the connection
        // rather than awaiting a permanently rejected one.
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
