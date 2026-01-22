# 🚀 Step-by-Step Guide: Deploy SimplifyED for Free (No API Failures)

Since you want to host this project completely for **free without API integration failures**, you can't use Replit's paid deployments. Instead, we'll use a combination of **Render** (free application hosting), **Neon** (free PostgreSQL database), and **OpenRouter** (free AI models). 

The application is already configured to use a free AI model from OpenRouter (`nvidia/nemotron-3-nano-30b-a3b:free`), so you just need an API key to avoid API limits. If deployed properly following these instructions, Replit Auth will automatically fallback to standard local authentication (Email + Password) because the Replit environment variables won't be set!

## Phase 1: Set Up the Free Database (Neon.tech)
SimplifyED requires a PostgreSQL database to store users and data.
1. Go to [Neon.tech](https://neon.tech/) and sign up for a free account.
2. Click **Create Project**, name it `SimplifyED-db`, and leave the default settings.
3. Once created, you will be taken to your dashboard. Look for **Connection Details** or **Connection String**.
4. Copy the entire connection string (it will look like `postgresql://neondb_owner:password123@ep-cool-snowflake...`).
5. **Save this string somewhere.** This is your `DATABASE_URL`.

## Phase 2: Get a Free AI API Key (OpenRouter)
Your app uses OpenRouter for its AI features. To avoid rate limits and "API Integration Failures", you must provide your own free key.
1. Go to [OpenRouter.ai](https://openrouter.ai/) and sign up with your Google account or email.
2. Navigate to **Keys** in your account settings and click **Create Key**.
3. Name it "SimplifyED App Key", create it, and immediately **copy the secret key** (it will look like `sk-or-v1-abc123...`).
4. **Save this key somewhere.** This is your `OPENROUTER_API_KEY`.

---

## Phase 3: Push Your Code to GitHub
Render (our free hosting provider) deploys directly from GitHub, so your code needs to be there.
1. Create a free account on [GitHub](https://github.com/).
2. Create a **New Repository**. Name it `SimplifyED` (you can keep it Private or Public).
3. If your code is not already in GitHub, upload it or push your local folder using Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/SimplifyED.git
   git push -u origin main
   ```

---

## Phase 4: Deploy the App on Render
Render allows you to host full-stack Node.js applications completely for free.
1. Go to [Render.com](https://render.com/) and create a free account (sign in with GitHub).
2. Click **New** -> **Web Service**.
3. Select **"Build and deploy from a Git repository"** and click **Next**.
4. Connect the `SimplifyED` repository you created in Phase 3.
5. Configure the deployment settings exactly as follows:
   - **Name:** `simplify-ed-app` (or whatever you prefer)
   - **Region:** Choose the one closest to you
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** "Free"

6. Scroll down to the **Environment Variables** section. Click **Add Environment Variable**. You must add these exact three variables:

   | Key                 | Value                                                 |
   | :---                | :---                                                  |
   | `NODE_ENV`          | `production`                                          |
   | `DATABASE_URL`      | *(Paste your copied Neon connection string here)*     |
   | `OPENROUTER_API_KEY`| *(Paste your copied OpenRouter key here)*             |

7. Click **Deploy Web Service** at the bottom of the page.

---

## Phase 5: Final Database Push
As the server is deploying on Render for the first time, your new database on Neon is actually empty! You need to push your Drizzle database schema to it.

Since your codebase allows local commands to affect the cloud database if you pass the `DATABASE_URL`, just run this locally in your terminal or inside Replit's shell (Replace the URL with your Neon connection string):

```bash
DATABASE_URL="your_neon_connection_string_here" npm run db:push
```
*Alternatively, if your local `.env` has the Neon database URL, you can just run `npm run db:push` locally!*

---

> [!SUCCESS]
> **Congratulations!** Once Render finishes building and deploying (it typically takes 3-5 minutes), your app will be live on a free sub-domain like `https://simplify-ed-app.onrender.com`. 
> 
> By following these steps, you avoid server crash loops (due to missing DBs), bypass AI integration errors (because you provided your own personal API key), and completely decouple from Replit's paid platform.



OpenRouter.ai API Key
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