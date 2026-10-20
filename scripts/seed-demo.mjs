// Inserts a demo resume + improved version into the local DB so the UI can be previewed without API keys.
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';

const dbPath = process.argv[2] ?? 'apps/api/data/app.db';
const db = new Database(dbPath);
const id = randomUUID();
const expires = Date.now() + 7 * 24 * 3_600_000;

const original = `Asha Rao
asha@example.com | Bengaluru

Backend engineer, 5 years. Worked at Acme on billing. Built APIs in Node and Nest. Made queries faster.
Skills: TypeScript, NestJS, PostgreSQL, Docker, AWS

Education: B.Tech CS, NIT Trichy, 2020`;

const profile = {
  fullName: 'Asha Rao',
  headline: 'Backend Engineer',
  seniority: 'mid',
  yearsOfExperience: 5,
  skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'AWS'],
  location: 'Bengaluru, India',
  summary: 'Backend engineer with five years of experience building billing APIs. Works mainly with Node.js and PostgreSQL.',
};

const improved = {
  fullName: 'Asha Rao',
  contact: ['asha@example.com', 'Bengaluru'],
  summary: 'Backend engineer with 5 years of experience building billing APIs in Node.js and NestJS, with a focus on query performance.',
  experience: [
    {
      role: 'Backend Engineer',
      company: 'Acme',
      period: null,
      bullets: ['Built and maintained billing APIs in NestJS and TypeScript.', 'Improved PostgreSQL query performance across billing services.'],
    },
  ],
  education: [{ degree: 'B.Tech Computer Science', school: 'NIT Trichy', period: '2020' }],
  skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'AWS'],
  extras: [],
  changeNotes: ['Turned short phrases into action-led bullets.', 'Moved education below experience.'],
  openQuestions: ['How much faster were the queries, and how many users or invoices did the billing service handle?'],
};

db.prepare('insert into resumes (id, original_text, filename, profile, expires_at) values (?, ?, ?, ?, ?)').run(
  id,
  original,
  'demo.pdf',
  JSON.stringify(profile),
  expires,
);
db.prepare('insert into resume_versions (id, resume_id, improved) values (?, ?, ?)').run(randomUUID(), id, JSON.stringify(improved));
console.log(id);
