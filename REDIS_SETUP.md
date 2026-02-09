# 🚀 How to Set Up Redis with Upstash

To enable faster page loads and caching, follow these steps to get your free Redis database credentials.

## Step 1: Create an Account
1.  Go to [Upstash Console](https://console.upstash.com/).
2.  **Sign in** with your GitHub/Google account or create a new one.

## Step 2: Create a Database
1.  In the dashboard, click the **"Create Database"** button within the "Redis" section.
2.  **Name**: Enter `gla-gallery` (or any name you like).
3.  **Region**: Select a region close to your users (e.g., `US-East-1` or `EU-West-1`).
4.  **TLS (SSL)**: Ensure this is enabled (default).
5.  Click **"Create"**.

## Step 3: Get Credentials
1.  Once created, scroll down to the **"REST API"** section on the database details page.
2.  You will see two important values under the `.env` tab or copy buttons:
    *   `UPSTASH_REDIS_REST_URL`
    *   `UPSTASH_REDIS_REST_TOKEN`

## Step 4: Add to Project
1.  Open your project in VS Code.
2.  Open (or create) the file named `.env.local` in the root directory.
3.  Paste the values you copied:

```env
# .env.local

UPSTASH_REDIS_REST_URL="https://your-db-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-secret-token..."
```

## Step 5: Verify
Restart your development server:
```bash
pnpm dev
```
Reload the page. If setup is correct, you will see instantaneous loads for trending posts!
