Railway quick deploy notes

1) Create a Railway account and install CLI
   - https://railway.app
   - CLI: https://railway.app/docs/cli

2) From `c:\Website\backend` run:
```powershell
railway login
railway init
railway up
```

3) In the Railway project settings (Dashboard) set the environment variables:
- `JWT_SECRET` = a long random string
- `CORS_ORIGIN` = your frontend URL (e.g., `https://your-app.vercel.app`)
- `NODE_ENV` = `production`
- If you prefer Postgres, add the Postgres plugin in Railway and set `DATABASE_URL`. You will need to migrate the backend to use Postgres or adapt `db.js`.

4) Notes about SQLite on Railway:
- Railway ephemeral containers do not persist local files by default. If you want to keep using SQLite you must configure persistent storage or use a managed database (Postgres) instead.

5) After deployment, copy the Railway backend URL and set `VITE_API_BASE` in your Vercel frontend environment variables to `https://<railway-backend>/api`.
