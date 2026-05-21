# Dr. Agenda

Aplicação Next.js para gestão multi-tenant de clínicas com Firebase Auth, Neon Postgres, Drizzle, Cloudinary, TanStack Query, Zustand, React Hook Form, Zod e Tailwind CSS.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run db:migrate
npm run migrate:firestore
```

## Migração Firestore -> Neon

Configure `DATABASE_URL` e `FIREBASE_SERVICE_ACCOUNT_JSON` no `.env.local` antes de executar `npm run migrate:firestore`.
