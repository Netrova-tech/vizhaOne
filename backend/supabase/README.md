# Supabase setup

Use Supabase as managed PostgreSQL only. Keep application authentication in the unified Node.js backend so a later GCP Cloud SQL migration only requires changing `DATABASE_URL`.

1. Create one Supabase project in the Mumbai/South Asia region when available.
2. Open Project Settings > Database and copy the **transaction pooler** connection string.
3. Put it in `backend/.env` as `DATABASE_URL`; never commit the password.
4. Run `npm install` and `npm run db:migrate` from `backend`.
5. Use `npm run db:check` to verify connectivity.

For GCP later: `pg_dump "$DATABASE_URL" --format=custom --file=vizhaone.dump`, then `pg_restore` into Cloud SQL PostgreSQL.
