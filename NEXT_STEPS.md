# Echoes Build Roadmap (Step-by-Step)

This guide outlines the next implementation milestones. Follow each step in order; every section calls out what to prepare, which commands to run, and what files to touch. Keep `.env.local` up to date and restart `npm run dev` after environment changes.

---

## 1. Environment Setup

### 1.1 Create `.env.local`
- Path: project root.
- Copy `.env.example` if it exists, otherwise create a new file.
- Ensure it is listed in `.gitignore` (already handled by Next.js scaffolding).

### 1.2 Spotify Developer App
1. Visit https://developer.spotify.com/dashboard and log in.
2. Create an app named “Echoes Dev”.
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback` (Spotify now requires loopback IP instead of `localhost`).
4. Copy credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
5. Paste into `.env.local`.

### 1.3 OpenAI Key
1. Log into https://platform.openai.com/account/api-keys.
2. Generate a secret key.
3. Add to `.env.local`:
   ```
   OPENAI_API_KEY=your_secret_key
   ```

### 1.4 Genius Lyrics API (optional but recommended)
1. Visit the [Genius API Client management page](https://genius.com/api-clients) while signed into your Genius account.  
2. Create a new API Client named “Echoes Dev” with the description “Lyric retrieval for Echoes recommendations.”  
3. Use the loopback redirect form Genius expects, e.g. `http://127.0.0.1:3000/api/genius/callback` (you can change it later for staging/production).  
4. After saving, copy the `Client ID` and `Client Secret`—you will need them to exchange OAuth codes for tokens if you implement user-level scopes.  
5. For read-only access (lyrics lookup) click “Generate Access Token” on the same page. Store it in `.env.local`:
   ```
   GENIUS_ACCESS_TOKEN=your_generated_access_token
   GENIUS_CLIENT_ID=your_genius_client_id
   GENIUS_CLIENT_SECRET=your_genius_client_secret
   GENIUS_REDIRECT_URI=http://127.0.0.1:3000/api/genius/callback
   ```
6. All Genius APIs require HTTPS; the access token must be sent as `Authorization: Bearer <token>` in every request.  
7. Keep the optional embed script handy if you want to render annotations in-app later:
   ```html
   <script src="https://genius.codes"></script>
   ```
8. If you later need write scopes (create/manage annotations), follow Genius’s OAuth flow using the saved `client_id`, `client_secret`, and redirect URI to exchange codes for user tokens.

### 1.5 Restart Dev Server
- Stop any running `npm run dev`.
- Re-run `npm run dev` to load new env variables.

---

## 2. Spotify OAuth Integration

### 2.1 Install Auth Dependencies
```bash
npm install next-auth @auth/core @auth/spotify
```

### 2.2 Create Auth Route
1. Create the folder structure `src/app/api/auth/[...nextauth]/`.
   - You should end up with:  
     ```
     src/
       app/
         api/
           auth/
             [...nextauth]/
               route.ts
     ```
2. In `route.ts`, paste the following (update scopes if you plan to request more later):
   ```ts
   import NextAuth, { type NextAuthOptions } from "next-auth";
   import SpotifyProvider from "next-auth/providers/spotify";

   const scopes = [
     "user-read-email",
     "playlist-modify-private",
     "playlist-modify-public",
   ].join(" ");

   export const authOptions: NextAuthOptions = {
     providers: [
       SpotifyProvider({
         clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
         clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
         authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(scopes)}`,
       }),
     ],
     secret: process.env.NEXTAUTH_SECRET,
     callbacks: {
       async jwt({ token, account }) {
         if (account) {
           token.accessToken = account.access_token;
           token.refreshToken = account.refresh_token;
           token.expiresAt = (account.expires_at ?? 0) * 1000;
         }
         return token;
       },
       async session({ session, token }) {
         session.accessToken = token.accessToken as string | undefined;
         session.refreshToken = token.refreshToken as string | undefined;
         session.expiresAt = token.expiresAt as number | undefined;
         return session;
       },
     },
   };

   const authHandler = NextAuth(authOptions);

   export { authHandler as GET, authHandler as POST };
   ```
3. Augment the NextAuth types so TypeScript knows about the extra session fields. Create `next-auth.d.ts` in the project root (same level as `next.config.ts`) with:
   ```ts
   import "next-auth";

   declare module "next-auth" {
     interface Session {
       accessToken?: string;
       refreshToken?: string;
       expiresAt?: number;
     }
   }

   declare module "next-auth/jwt" {
     interface JWT {
       accessToken?: string;
       refreshToken?: string;
       expiresAt?: number;
     }
   }
   ```

### 2.3 Session Provider
- Create `src/components/session-provider.tsx` that wraps `SessionProvider`.
- Update `src/app/layout.tsx`:
  ```tsx
  import { SessionProvider } from "@/components/session-provider";
  ...
  <body>
    <SessionProvider>{children}</SessionProvider>
  </body>
  ```

### 2.4 UI Buttons
- Add `Login with Spotify` button (e.g., in navbar or hero).
- Use `signIn("spotify")` and `signOut()` from `next-auth/react`.
- Render user name/photo after login to confirm session works.

### 2.5 Test OAuth
1. Run `npm run dev`.
2. Visit `/api/auth/signin`.
3. Complete Spotify login; confirm redirect back to `/`.
4. Check browser devtools → Application → Cookies for `next-auth.session-token`.

---

## 3. Track Search API

### 3.1 Create API Route
- File: `src/app/api/search/route.ts`.
- Steps:
  1. Use `getServerSession` to ensure the user is logged in.
  2. Fetch access token from session.
  3. Call Spotify search endpoint:
     ```
     GET https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10
     ```
  4. Map response to simplified objects:
     ```ts
     {
       id,
       title,
       artist: artists.map(a => a.name).join(", "),
       albumArt: album.images[0]?.url,
       previewUrl
     }
     ```
  5. Return as JSON.

### 3.2 Hook Up Form
- Convert form on `src/app/page.tsx` into a client component:
  - Wrap hero content in `'use client'` component or create `SearchForm.tsx`.
  - Manage input state, call `fetch("/api/search", { method: "POST", ... })`.
  - Display a loading spinner and handle errors.

### 3.3 Render Results
- Below the form, show a grid/list of returned tracks.
- Include album art (use `next/image`), song title, artist.
- Add `onClick` handler for each result → triggers analysis workflow (next steps).

---

## 4. Lyrics Retrieval Service

### 4.1 Choose Provider
- Genius (easy but requires scraping for full lyrics) or Musixmatch (official API, more constraints).

### 4.2 Implement Fetcher
- Create `src/server/lyrics.ts`:
  ```ts
  export async function fetchLyrics({ title, artist }: { title: string; artist: string }) {
    // call provider API
    // clean lyrics (strip timestamps, annotations)
    return cleanedLyrics;
  }
  ```
- Cache results in memory initially (Map or simple LRU). Later: Redis/Postgres.

### 4.3 API Endpoint
- Add `POST /api/track/lyrics` taking `trackId` or `title/artist`.
- Use session token to ensure authorized user.
- Return normalized lyrics or error message if unavailable.

---

## 5. Embeddings Pipeline

### 5.1 OpenAI Client
- Create `src/server/openai.ts`:
  ```ts
  import OpenAI from "openai";
  export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  ```

### 5.2 Lyrics Embedding Route
- `POST /api/embed/lyrics`
  - Body: `{ lyrics: string }`
  - Call `openai.embeddings.create({ model: "text-embedding-3-large", input: lyrics })`
  - Return embedding vector.

### 5.3 Storage Layer
- Decide on Postgres (with `pgvector`) or another vector DB.
- If Postgres:
  1. Install extension.
  2. Create table `lyrics_embeddings (track_id text primary key, embedding vector(3072))`.
  3. Insert new vectors and update if lyrics change.

### 5.4 Audio Embeddings (Future Task)
- Set up Python service using Librosa or Essentia.
- Expose REST endpoint or use queue to compute MFCC/chroma features.
- Store results in `audio_embeddings` table.

---

## 6. Recommendation Engine

### 6.1 Data Prep
- Ensure each track has:
  - `lyrics_embedding`
  - optionally `audio_embedding`
  - Spotify feature vector (compute simple normalized vector of valence, energy, etc.)

### 6.2 Similarity Query
- For Postgres + pgvector:
  ```sql
  SELECT track_id,
         0.5 * (1 - (lyrics_embedding <=> source_lyrics))
       + 0.35 * (1 - (audio_embedding <=> source_audio))
       + 0.15 * (1 - (spotify_embedding <=> source_spotify)) AS score
  FROM track_embeddings
  ORDER BY score DESC
  LIMIT 20;
  ```
  - Adjust weights based on user input.

### 6.3 API Endpoint
- `POST /api/recommend`
  - Body: `{ trackId, limit, weights }`
  - Fetch source embeddings; if missing, compute on demand (queue background job).
  - Return recommended track metadata along with `score` and per-channel breakdown.

### 6.4 Frontend Integration
- Add slider controls (lyrics/melody/vibe).
- Display similarity chips (“Lyric twin”, etc.).
- Provide “Generate Playlist” CTA.

---

## 7. Playlist Creator

### 7.1 API Endpoint
- `POST /api/playlist/create`
  - Body: `{ sourceTrackId, trackIds: string[], name?: string }`
  - Call Spotify:
    1. `POST /v1/users/{user_id}/playlists`
    2. `POST /v1/playlists/{playlist_id}/tracks`
  - Return playlist URL + ID.

### 7.2 Frontend Modal
- After recommendations, show modal with:
  - Playlist name input (default `<track>_alikes`)
  - List of tracks to include (allow deselect).
  - Confirmation screen with Spotify embed preview.

---

## 8. Persistence & Caching

### 8.1 Database
- Set up Postgres (local Docker or hosted, e.g. Supabase/Neon).
- Store tables:
  - `users`
  - `tracks`
  - `lyrics_embeddings`
  - `audio_embeddings`
  - `spotify_features`
  - `recommendation_logs`

### 8.2 Redis (Optional now, recommended later)
- Use for caching lyrics responses, Spotify search results.
- Queue heavy jobs (audio analysis) for worker workers.

---

## 9. Observability & Tooling

### 9.1 Logging
- Install `pino` or use `console` for now.
- Wrap API routes in try/catch and log failures with context (track ID, user ID).

### 9.2 Error Boundaries
- For client components, add error UI for search/playlist actions.
- Consider Next.js error routes for API failures.

### 9.3 Rate Limiting
- Implement guard middleware for Spotify endpoints to prevent hitting rate caps.
- Track number of requests per user per minute.

---

## 10. UX Polish

### 10.1 Search Skeleton
- While fetching search results, show shimmering placeholders (Tailwind `animate-pulse`).

### 10.2 Results State
- Empty state message when no tracks found.
- Handle unauthenticated state (prompt login).

### 10.3 Mobile Responsive
- Ensure hero, sliders, results list, and playlist modals scale on small screens.
  - Use Tailwind breakpoints (`sm`, `md`, etc.).

---

## 11. Staging & Deployment Prep

### 11.1 Vercel Project
- Create a new Vercel project linked to the repo.
- Add environment variables in Vercel dashboard.

### 11.2 Preview Envs
- Each branch deploys to preview URL—use for QA before merging.

### 11.3 Production Checklist
- Ensure OAuth redirect URIs include Vercel domain.
- Confirm OpenAI usage meets quotas (monitor usage dashboard).

---

## 12. Documentation & Handoff

### 12.1 Update README
- Add instructions for running the auth flow.
- Document environment variables with descriptions.

### 12.2 Record API Contracts
- For each API route (`/search`, `/recommend`, etc.), document request/response shapes in `docs/api.md`.

### 12.3 Track Progress
- Use TODO / issue tracker for remaining work (embedding queue, playlist UI, etc.).

---

By following these steps, you will move from the current landing experience to a functional Echoes prototype with Spotify login, search, lyric analysis, embeddings, and playlist generation. Reach out if you need code samples for any specific route or worker.***

