# Bhooter Bari

Anonymous, invite-only rooms with end-to-end encryption, ephemeral timers up to sixty minutes, and real-time collaboration across chat, approvals, reactions, and moderation. Built with Next.js, Tailwind CSS, Express, Prisma, PostgreSQL, and Socket.io.

## Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, socket.io-client, deployed to Vercel
- Backend: Node.js, Express, Socket.io, Prisma ORM, PostgreSQL, deployed to Render
- E2EE: AES-GCM symmetric keys generated client-side and shared only via URL fragment

## Backend setup (`backend`)
1. Install dependencies: `npm install`
2. Configure environment variables:
   - `DATABASE_URL` PostgreSQL connection string
   - `PORT` server port (default 4000)
   - `NODE_ENV` `development` or `production`
   - `ADMIN_PANEL_USERNAME` admin login username
   - `ADMIN_PANEL_PASSWORD` admin login password
   - `ADMIN_SESSION_SECRET` signing secret for admin sessions
   - `MEMBER_TOKEN_SECRET` signing secret for member tokens (falls back to admin secret)
   - `ROOM_CREATION_HOURLY_LIMIT` defaults to 3
   - `FRONTEND_ORIGIN` allowed origin for CORS/WebSocket (e.g. `https://your-frontend.vercel.app`)
3. Prisma: `npx prisma generate` then `npx prisma migrate dev --name init` (or `prisma migrate deploy` in prod).
4. Run dev server: `npm run dev`
5. Build/start: `npm run build && npm start`

## Frontend setup (`frontend`)
1. Install dependencies: `npm install`
2. Configure env: `NEXT_PUBLIC_API_BASE_URL` pointing at the backend (e.g. `https://your-backend.onrender.com`).
3. Run dev server: `npm run dev`
4. Build/start: `npm run build && npm start`

## Deployment
- Backend (Render): create a Web Service, set environment variables above, build command `npm run build`, start command `npm start`, make sure Postgres is provisioned and `DATABASE_URL` set. No Docker needed.
- Frontend (Vercel): set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL, deploy directly from the `frontend` folder.

## Features and security
- Rooms are invite-only; slugs are non-guessable and optional passwords plus approval gating are supported.
- Per-room AES-GCM keys are generated client-side and live only in the URL hash/session memory; the server stores only ciphertext/IV pairs.
- Ephemeral by design: maximum 60-minute timers, server-side cleanup deletes rooms, messages, attachments, and sessions after expiry or manual deletion.
- Attachments up to 10 MB are encrypted client-side and stored as opaque blobs; downloads return ciphertext only.
- Creator controls include approvals, timer changes, mutes/kicks with IP blocks, panic wipes, burn-after-read, self-destruct timers, and content toggles.
- Admin dashboard (env-guarded) shows daily totals, lifetime aggregates, and last 7 days of analytics; analytics rows persist beyond room deletion.
