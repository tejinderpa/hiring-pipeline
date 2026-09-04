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

function daysAgo(days) {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days) {
  const date = new Date();
  date.setHours(14, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfCurrentMonth() {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(1);
  return date;
}

const demoApplications = [
  {
    id: 'app-asha-mehta-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Asha Mehta',
    candidateEmail: 'asha.mehta@example.com',
    source: 'LinkedIn',
    notes: 'Strong React portfolio with dashboard experience.',
    stage: 'SCREENING',
    appliedAt: daysAgo(21),
    stageEnteredAt: daysAgo(14),
    interviewScheduledAt: null,
  },
  {
    id: 'app-daniel-cho-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Daniel Cho',
    candidateEmail: 'daniel.cho@example.com',
    source: 'Referral',
    notes: 'Previously worked on design systems.',
    stage: 'INTERVIEW',
    appliedAt: daysAgo(10),
    stageEnteredAt: daysAgo(3),
    interviewScheduledAt: daysFromNow(1),
  },
  {
    id: 'app-maya-bennett-customer-success',
    jobOpeningId: 'job-customer-success-manager',
    candidateName: 'Maya Bennett',
    candidateEmail: 'maya.bennett@example.com',
    source: 'Careers Page',
    notes: 'Has SaaS onboarding experience.',
    stage: 'APPLIED',
    appliedAt: daysAgo(2),
    stageEnteredAt: daysAgo(2),
    interviewScheduledAt: null,
  },
  {
    id: 'app-omar-nadeem-customer-success',
    jobOpeningId: 'job-customer-success-manager',
    candidateName: 'Omar Nadeem',
    candidateEmail: 'omar.nadeem@example.com',
    source: 'LinkedIn',
    notes: 'Good background in technical customer support.',
    stage: 'OFFER',
    appliedAt: daysAgo(35),
    stageEnteredAt: daysAgo(5),
    interviewScheduledAt: daysAgo(4),
  },
  {
    id: 'app-priya-raman-sales',
    jobOpeningId: 'job-sales-development-representative',
    candidateName: 'Priya Raman',
    candidateEmail: 'priya.raman@example.com',
    source: 'Agency',
    notes: 'Early-career sales candidate with strong communication notes.',
    stage: 'HIRED',
    appliedAt: daysAgo(24),
    stageEnteredAt: startOfCurrentMonth(),
    interviewScheduledAt: daysAgo(3),
  },
  {
    id: 'app-lucas-grant-operations',
    jobOpeningId: 'job-operations-coordinator',
    candidateName: 'Lucas Grant',
    candidateEmail: 'lucas.grant@example.com',
    source: 'Referral',
    notes: 'Organized coordinator profile for the closed operations opening.',
    stage: 'REJECTED',
    rejectedFromStage: 'SCREENING',
    appliedAt: daysAgo(42),
    stageEnteredAt: daysAgo(18),
    interviewScheduledAt: null,
  },
  {
    id: 'app-elena-rossi-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Elena Rossi',
    candidateEmail: 'elena.rossi@example.com',
    source: 'Careers Page',
    notes: 'Frontend candidate with analytics product experience.',
    stage: 'INTERVIEW',
    appliedAt: daysAgo(17),
    stageEnteredAt: daysAgo(1),
    interviewScheduledAt: daysFromNow(2),
  },
  {
    id: 'app-noah-wilson-sales',
    jobOpeningId: 'job-sales-development-representative',
    candidateName: 'Noah Wilson',
    candidateEmail: 'noah.wilson@example.com',
    source: 'LinkedIn',
    notes: 'Outbound prospecting background.',
    stage: 'SCREENING',
    appliedAt: daysAgo(8),
    stageEnteredAt: daysAgo(4),
    interviewScheduledAt: null,
  },
  {
    id: 'app-samira-khan-customer-success',
    jobOpeningId: 'job-customer-success-manager',
    candidateName: 'Samira Khan',
    candidateEmail: 'samira.khan@example.com',
    source: 'Referral',
    notes: 'Customer escalation and renewals experience.',
    stage: 'HIRED',
    appliedAt: daysAgo(55),
    stageEnteredAt: daysAgo(1),
    interviewScheduledAt: daysAgo(9),
  },
  {
    id: 'app-ethan-lee-frontend',
    jobOpeningId: 'job-frontend-engineer',
    candidateName: 'Ethan Lee',
    candidateEmail: 'ethan.lee@example.com',
    source: 'Agency',
    notes: 'Recent applicant for frontend opening.',
    stage: 'APPLIED',
    appliedAt: daysAgo(0),
    stageEnteredAt: daysAgo(0),
    interviewScheduledAt: null,
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
        stage: application.stage,
        rejectedFromStage: application.rejectedFromStage ?? null,
        appliedAt: application.appliedAt,
        stageEnteredAt: application.stageEnteredAt,
        interviewScheduledAt: application.interviewScheduledAt,
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
