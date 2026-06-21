# Gb Staff Performance

Quarterly staff performance evaluation system for a jiu-jitsu school.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS
- Anthropic API for scorecard summaries
- Resend for evaluation invitation emails

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL running locally

## Environment

Copy `.env.example` to `.env` and fill values.

Required for email invites and token links:

- `APP_URL` (example: `http://localhost:3000`)
- `SCHOOL_NAME`
- `RESEND_API_KEY`
- `EMAIL_FROM` (example: `noreply@bjjstaffvaluation.com`)

Required for admin authentication:

- `NEXTAUTH_URL` (example: `http://localhost:3000`)
- `NEXTAUTH_SECRET`

Restart the dev server after changing `.env` so Next.js reloads the updated mail settings.

## Run Locally

```bash
npm install
npx prisma generate
npm run dev
```

## Build

```bash
npm run build
```

## CR-01 Email + Token Endpoints

- `POST /api/admin/evaluators` creates evaluator with one-time UUID token; can send invite immediately via `sendInvite: true`
- `POST /api/admin/evaluators/send-requests` sends invites for all pending evaluators of a staff member in a cycle
- `POST /api/admin/evaluators/:evaluatorId/resend` resends the same token link to one evaluator
- `GET /api/evaluate/:token` validates token
- `POST /api/evaluate/:token` submits once and marks token as used
