# Fix: "The table `public.conversation` does not exist"

The messaging tables haven’t been created in your database yet. Apply the migration using **one** of these methods.

---

## Option 1: Prisma (recommended)

In a terminal **in your project root** (e.g. `C:\Users\justi\Documents\GitHub\UNT-Marketplace`), run:

```bash
npm run db:migrate
```

Or:

```bash
npx prisma migrate deploy
```

Use the same terminal/environment where you normally run `npm run dev` (so the same Node/npm and `.env` with `DATABASE_URL` are used).

---

## Option 2: Run the SQL yourself

If Option 1 fails or you prefer to run SQL by hand:

1. Open your PostgreSQL client (pgAdmin, DBeaver, Azure Data Studio, or `psql`) and connect with the same database as in your `.env` `DATABASE_URL`.
2. Open this file in your project:
   `prisma/migrations/20260128000000_add_messaging_tables/migration.sql`
3. Execute the entire contents of that file in your database.

After that, the `conversation` and `message` tables will exist and the error should go away.

---

## Check that it worked

- Restart your dev server (`npm run dev`), then open `/market/messages` again.
- Or in your DB client, check that the `public.conversation` and `public.message` tables exist.
