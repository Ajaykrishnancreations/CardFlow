# CardFlow Free Live Cloud Hosting Guide

This guide shows you how to host the **Go Backend**, **PostgreSQL + PostGIS Database**, and **Redis** completely **FREE** with instant live public URLs.

---

## 🌟 Recommended Free Hosting Stack

| Component | Recommended Free Provider | Free Tier Details |
| :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | **[Supabase](https://supabase.com)** or **[Neon](https://neon.tech)** | 500MB storage, PostGIS extension pre-installed, free forever |
| **Redis** | **[Upstash](https://upstash.com)** | 10,000 requests/day, Serverless Redis, free forever |
| **Go Backend API** | **[Render](https://render.com)** or **[Koyeb](https://koyeb.com)** | 750 free hours/month, automatic HTTPS public URL |
| **Object Storage (S3)** | **[Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)** | 10 GB free storage, 0 egress fees |

---

## Step 1: Create Free PostgreSQL with PostGIS on Supabase (2 mins)

1. Go to **[supabase.com](https://supabase.com)** and sign up with GitHub or Google (Free).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `cardflow-db`
   - **Database Password**: *(Choose a strong password and save it)*
   - **Region**: Choose closest (e.g. `South Asia (Mumbai)` or `Singapore`)
   - **Pricing Plan**: Free ($0/month)
4. Go to **Project Settings** (gear icon) → **Database** → **Connection String** → Select **URI** (or **Session Pooler**).
5. Copy the connection URI. It looks like:
   ```text
   postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
6. In Supabase Dashboard, click **SQL Editor** on the left menu, paste and run this one-line command to enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

---

## Step 2: Create Free Serverless Redis on Upstash (1 min)

1. Go to **[upstash.com](https://upstash.com)** and sign in with GitHub or Google (Free).
2. Click **"Create Database"**.
3. Fill in:
   - **Name**: `cardflow-redis`
   - **Type**: Regional
   - **Region**: Same or closest region as database (e.g. `ap-south-1` Mumbai)
4. Once created, scroll to the **Connect to your database** section and select **Go (redis-go)** or view the endpoint details:
   - **Endpoint / Host**: e.g., `flowing-frog-12345.upstash.io`
   - **Port**: `6379`
   - **Password**: *(Copy the provided password string)*

---

## Step 3: Deploy Go Backend on Render (3 mins)

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial CardFlow release with Go backend and RN Web"
   # Push to your GitHub repo (e.g., github.com/your-username/cardflow)
   ```
2. Go to **[render.com](https://render.com)** and sign up/log in with GitHub.
3. Click **"New +"** → **"Web Service"**.
4. Connect your CardFlow GitHub repository.
5. Configure the settings:
   - **Name**: `cardflow-api`
   - **Region**: Singapore or nearest
   - **Root Directory**: `backend`
   - **Runtime**: `Go`
   - **Build Command**: `go build -o server ./cmd/api`
   - **Start Command**: `./server`
   - **Instance Type**: `Free` ($0/month)
6. Scroll down to **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgres://user:pass@host/db?sslmode=require` | **Required for scan/save.** Full URI from Neon or Supabase (see Step 1) |
| `ENV` | `production` | App environment |
| `PORT` | `8080` | Render port |
| `REDIS_URL` | `rediss://...` (optional) | From Upstash — OTP works without it in dev mock mode |
| `JWT_PRIVATE_KEY` | `any-random-32-char-secret-key-goes-here` | Secret signing key |
| `DEV_MOCK_SMS` | `true` | Allows fixed dev OTP (123456) for instant testing |
| `DEV_MOCK_GEMINI` | `true` | Allows instant AI business card extraction |
| `ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` | Your frontend URL |

> **Important:** Without `DATABASE_URL`, login works but **scan/save card will fail**. After adding it, click **Manual Deploy → Clear build cache & deploy**.

7. Click **"Create Web Service"**.
8. Render will build the Go app and give you a live URL like:
   ```text
   https://cardflow-api.onrender.com
   ```

---

## Step 4: Test Your Live Cloud API

Once deployed, you can verify your live backend in Chrome or via cURL:

1. **Health check**:
   ```text
   https://cardflow-api.onrender.com/health
   ```
   *Expected Response:* `{"data":{"database":"connected","status":"healthy",...},"status":"success"}` — if `"database":"disconnected"`, add `DATABASE_URL` and redeploy.

2. **Public business profile in Chrome**:
   ```text
   https://cardflow-api.onrender.com/b/kovai-precision-tools
   ```

3. **Categories API**:
   ```text
   https://cardflow-api.onrender.com/api/v1/categories
   ```

4. **Connect Frontend to Live Backend**:
   In your frontend, point the API base URL to your Render live URL:
   ```javascript
   export const API_BASE_URL = "https://cardflow-api.onrender.com/api/v1";
   ```
