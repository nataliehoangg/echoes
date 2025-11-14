# Deployment Guide

This guide covers deploying Echoes to production using Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account (free tier works)
- Spotify Developer App configured
- OpenAI API key
- Genius API credentials (optional)

## Step 1: Create Vercel Project

1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

## Step 2: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXTAUTH_SECRET=generate_a_random_string_here
NEXTAUTH_URL=https://your-app.vercel.app
OPENAI_API_KEY=your_openai_api_key
```

### Optional
```
GENIUS_ACCESS_TOKEN=your_genius_token
GENIUS_CLIENT_ID=your_genius_client_id
GENIUS_CLIENT_SECRET=your_genius_client_secret
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## Step 3: Update Spotify Redirect URI

1. Go to https://developer.spotify.com/dashboard
2. Open your app
3. Click "Edit Settings"
4. Add redirect URI: `https://your-app.vercel.app/api/auth/callback/spotify`
5. Save changes

## Step 4: Update Genius Redirect URI (if using)

1. Go to https://genius.com/api-clients
2. Edit your API client
3. Update redirect URI to: `https://your-app.vercel.app/api/genius/callback`

## Step 5: Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check the deployment logs for any errors
4. Visit your deployed URL

## Step 6: Database Setup (Production)

For production, you'll need to set up a PostgreSQL database with pgvector:

### Option A: Supabase (Recommended)
1. Create account at https://supabase.com
2. Create a new project
3. Enable pgvector extension in SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Run the schema from `src/server/db.ts`
5. Add connection string to Vercel env vars:
   ```
   POSTGRES_URL=your_supabase_connection_string
   ```

### Option B: Neon
1. Create account at https://neon.tech
2. Create a new project
3. Enable pgvector extension
4. Run the schema from `src/server/db.ts`
5. Add connection string to Vercel env vars

### Option C: Vercel Postgres
1. In Vercel dashboard, go to Storage
2. Create a Postgres database
3. Enable pgvector extension
4. Run the schema
5. Connection string is automatically available

## Step 7: Redis Setup (Optional, for caching)

For production caching and rate limiting:

1. Use Upstash Redis (free tier available)
2. Create account at https://upstash.com
3. Create a Redis database
4. Add to Vercel env vars:
   ```
   REDIS_URL=your_upstash_redis_url
   REDIS_TOKEN=your_upstash_redis_token
   ```

## Step 8: Monitoring

- Vercel provides built-in analytics
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor API usage in OpenAI dashboard
- Check Spotify API quota usage

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### OAuth Not Working
- Verify redirect URI matches exactly (including trailing slash)
- Check `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set

### API Errors
- Check API keys are valid
- Verify rate limits aren't exceeded
- Check CORS settings if calling from frontend

## Preview Deployments

Every branch and PR automatically gets a preview deployment:
- Use these for testing before merging
- Update Spotify redirect URIs to include preview URLs if needed
- Test OAuth flow on preview deployments

## Production Checklist

- [ ] All environment variables set
- [ ] Spotify redirect URI updated
- [ ] Database configured (if using)
- [ ] Redis configured (if using)
- [ ] Error tracking set up
- [ ] Analytics configured
- [ ] Rate limiting tested
- [ ] OAuth flow tested
- [ ] Playlist creation tested
- [ ] Mobile responsive tested

