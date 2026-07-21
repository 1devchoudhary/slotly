import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDemoData } from '../src/lib/demoData';

dotenv.config();

const seed = async () => {
  if (process.env.DEMO_MODE !== 'true') {
    console.error('Seeding is only allowed in DEMO_MODE=true');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Destructive: this wipes the target database before repopulating it.
    await mongoose.connection.db?.dropDatabase();
    console.log('Dropped database');

    const summary = await seedDemoData();
    console.log(
      `Database seeded: ${summary.users} users, ${summary.services} services, ` +
        `${summary.staff} staff, ${summary.bookings} bookings`
    );
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
