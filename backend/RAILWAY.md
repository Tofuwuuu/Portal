# Railway Backend Deployment

## 1. Install CLI & login

```bash
npm install -g @railway/cli
railway login
```

## 2. Create project & deploy backend

```bash
cd backend
railway init
railway add --database postgres
railway up
```

## 3. Set environment variables

In the [Railway dashboard](https://railway.app) → your service → Variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | A long random string (change from default) |
| `CORS_ORIGINS` | `https://frontend-blue-beta-n3fz9uwjje.vercel.app` |

`DATABASE_URL` is set automatically when you add PostgreSQL.

## 4. Get your backend URL

Railway dashboard → backend service → **Settings** → **Networking** → **Generate Domain**

Example: `https://portal-backend-production.up.railway.app`

## 5. Connect Vercel frontend

In [Vercel env vars](https://vercel.com/mark-roderick-i-salise-s-projects/frontend/settings/environment-variables):

```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

Then redeploy frontend:

```bash
cd frontend
npx vercel deploy --prod
```

## Default teacher account

After deploy, the seeded teacher account works:

- Email: `admin@admin.com`
- Password: `admin`

Change this password in production.
