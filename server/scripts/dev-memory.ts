/**
 * Runs the API against a throwaway in-memory MongoDB, seeded with demo data.
 *
 * This is what makes the project clonable: `npm run dev:demo` boots the whole
 * stack with no MongoDB install, no Atlas account, and no credentials. Data
 * lives only for the lifetime of the process.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { seedDemoData } from '../src/lib/demoData';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function main() {
  console.log('Starting in-memory MongoDB (first run downloads a binary)…');
  const mongo = await MongoMemoryServer.create();

  await mongoose.connect(mongo.getUri());
  console.log('Connected to in-memory MongoDB');

  const summary = await seedDemoData();
  console.log(
    `Seeded ${summary.bookings} bookings across ${summary.staff} staff ` +
      `and ${summary.services} services`
  );

  const server = app.listen(PORT, () => {
    console.log(`\n  API ready on http://localhost:${PORT}/api`);
    console.log('  Sign in with admin@slotly.demo / demo1234\n');
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start demo server:', error);
  process.exit(1);
});
