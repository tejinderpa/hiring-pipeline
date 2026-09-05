import { PrismaPg } from '@prisma/adapter-pg';
import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required to connect Prisma to the database');
  }

  return databaseUrl;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });
