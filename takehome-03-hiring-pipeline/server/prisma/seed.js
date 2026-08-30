import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const demoUsers = [
  {
    email: 'recruiter@example.com',
    password: 'RecruiterPass123!',
    role: 'RECRUITER',
  },
  {
    email: 'interviewer@example.com',
    password: 'InterviewerPass123!',
    role: 'INTERVIEWER',
  },
];

const demoJobs = [
  {
    id: 'job-frontend-engineer',
    title: 'Frontend Engineer',
    department: 'Engineering',
    description: 'Build React interfaces for internal hiring workflows.',
    status: 'OPEN',
  },
  {
    id: 'job-customer-success-manager',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    description: 'Support customers during onboarding and expansion.',
    status: 'OPEN',
  },
  {
    id: 'job-sales-development-representative',
    title: 'Sales Development Representative',
    department: 'Sales',
    description: 'Qualify inbound leads and support pipeline generation.',
    status: 'OPEN',
  },
  {
    id: 'job-operations-coordinator',
    title: 'Operations Coordinator',
    department: 'Operations',
    description: 'Coordinate internal hiring operations and vendor follow-ups.',
    status: 'CLOSED',
  },
];

const demoApplications = [
  {
    id: 'app-asha-mehta-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Asha Mehta',
    candidateEmail: 'asha.mehta@example.com',
    source: 'LinkedIn',
    notes: 'Strong React portfolio with dashboard experience.',
  },
  {
    id: 'app-daniel-cho-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Daniel Cho',
    candidateEmail: 'daniel.cho@example.com',
    source: 'Referral',
    notes: 'Previously worked on design systems.',
  },
  {
    id: 'app-maya-bennett-customer-success',
    jobOpeningId: 'job-customer-success-manager',
    candidateName: 'Maya Bennett',
    candidateEmail: 'maya.bennett@example.com',
    source: 'Careers Page',
    notes: 'Has SaaS onboarding experience.',
  },
  {
    id: 'app-omar-nadeem-customer-success',
    jobOpeningId: 'job-customer-success-manager',
    candidateName: 'Omar Nadeem',
    candidateEmail: 'omar.nadeem@example.com',
    source: 'LinkedIn',
    notes: 'Good background in technical customer support.',
  },
  {
    id: 'app-priya-raman-sales',
    jobOpeningId: 'job-sales-development-representative',
    candidateName: 'Priya Raman',
    candidateEmail: 'priya.raman@example.com',
    source: 'Agency',
    notes: 'Early-career sales candidate with strong communication notes.',
  },
  {
    id: 'app-lucas-grant-operations',
    jobOpeningId: 'job-operations-coordinator',
    candidateName: 'Lucas Grant',
    candidateEmail: 'lucas.grant@example.com',
    source: 'Referral',
    notes: 'Organized coordinator profile for the closed operations opening.',
  },
];

async function main() {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        role: user.role,
      },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }

  for (const job of demoJobs) {
    await prisma.jobOpening.upsert({
      where: { id: job.id },
      update: {
        title: job.title,
        department: job.department,
        description: job.description,
        status: job.status,
        archivedAt: null,
      },
      create: job,
    });
  }

  for (const application of demoApplications) {
    await prisma.application.upsert({
      where: { id: application.id },
      update: {
        jobOpeningId: application.jobOpeningId,
        candidateName: application.candidateName,
        candidateEmail: application.candidateEmail,
        source: application.source,
        notes: application.notes,
      },
      create: application,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
