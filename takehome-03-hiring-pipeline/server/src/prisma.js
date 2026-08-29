import { PrismaPg } from '@prisma/adapter-pg';
import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
