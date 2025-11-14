# 🎵 Echoes

Find music that feels like your favorite song. Echoes blends lyric intent, melodic fingerprint, and Spotify audio sentiment to surface songs that resonate the way your go-to track does. It understands the story behind the sound.

---

## 🚀 Features

- **Search-first homepage** with an animated hero and real-time autocomplete suggestions.
- **Weighted similarity scoring** that combines lyrics embeddings, audio features, and Spotify sentiment.
- **Interactive weight sliders** to adjust how much lyrics, melody, and vibe influence recommendations.
- **Detailed track analysis** including album art, preview players, and Spotify links.
- **Playlist creation** with custom naming and track selection before adding to Spotify.
- **Translucent global navbar** with links to `HOME` and `ABOUT` (the About page mirrors the hero aesthetic).
- **Spotify OAuth integration** for seamless authentication and playlist management.
- **Real-time recommendations** powered by OpenAI embeddings and Spotify's recommendation engine.

---

## 🏗️ Project Structure

```
echoes/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (auth, search, track analysis, recommendations, playlist)
│   │   ├── about/        # About page
│   │   └── page.tsx      # Homepage with search
│   ├── components/       # React components (navbar, track cards, modals, sliders)
│   ├── server/           # Server utilities (OpenAI client, database structure)
│   └── lib/              # Shared utilities
├── docs/                 # API documentation
└── public/               # Static assets
```

---

## 🛠️ Tech Stack

| Area      | Technology                                                |
|-----------|-----------------------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, NextAuth.js |
| Backend   | Next.js API Routes, Node.js                               |
| Database  | PostgreSQL + pgvector (planned), in-memory cache (current) |
| AI/ML     | OpenAI Embeddings (text-embedding-3-large), Python audio embeddings (planned) |
| APIs      | Spotify Web API, Genius API (lyrics), OpenAI API         |

---

## 📦 Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Spotify Developer Account
- OpenAI API Key
- Genius API credentials (optional, for lyrics)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://127.0.0.1:3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Genius (optional)
GENIUS_ACCESS_TOKEN=your_genius_token
GENIUS_CLIENT_ID=your_genius_client_id
GENIUS_CLIENT_SECRET=your_genius_client_secret

# Database (for production)
# POSTGRES_URL=your_postgres_connection_string

# Redis (optional, for caching)
# REDIS_URL=your_redis_connection_string
```

> All `.env.local` files are gitignored. Never commit keys—use local `.env.local` files and environment variables in production.

### 3. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret to `.env.local`
5. If in Development Mode, add your email to the "Users and Access" whitelist

See `NEXT_STEPS.md` for detailed setup instructions.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://127.0.0.1:3000`

---

## 🧠 How Similarity Scores Are Calculated

1. **Lyrics Embedding** – Song lyrics are fetched from Genius API (or other sources) and converted to high-dimensional vectors using OpenAI's `text-embedding-3-large` model (3072 dimensions).

2. **Audio Features** – Spotify provides audio analysis including danceability, energy, valence, acousticness, instrumentalness, speechiness, and liveness.

3. **Weighted Similarity** – The final recommendation score combines multiple factors:

   - **Lyrics Similarity** (default 50%): Cosine similarity between source and candidate track lyrics embeddings.
   - **Audio Similarity** (default 35%): Placeholder for future audio embeddings from Python microservice.
   - **Spotify Features** (default 15%): Cosine similarity between normalized Spotify audio features.

4. **Scoring Formula** – Each candidate track receives a weighted score:
   ```
   totalScore = (lyricsScore × lyricsWeight) + 
                (audioScore × audioWeight) + 
                (spotifyScore × spotifyWeight)
   ```

5. **Ranking** – Tracks are sorted by total score (descending) and the top N results are returned (default: 30).

Users can adjust the weights in real-time using the interactive sliders on the homepage, allowing them to prioritize lyrics meaning, musical structure, or overall vibe.

---

## 🔄 API Workflow

1. **Search** – User searches for a track using Spotify's search API with real-time autocomplete suggestions.

2. **Track Selection** – Selected track triggers analysis: lyrics fetching, embedding generation, and audio features extraction.

3. **Recommendations Base** – Spotify's recommendations API provides 50 candidate tracks using the selected track as a seed.

4. **Similarity Scoring** – Each candidate is scored against the source track using:
   - Lyrics embeddings (if available)
   - Spotify audio features
   - Audio embeddings (when implemented)

5. **Weighted Ranking** – Scores are combined using user-defined weights and sorted.

6. **Playlist Creation** – Users can select tracks and create a Spotify playlist with custom naming.

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Search for tracks on Spotify |
| `/api/track/analyze` | POST | Analyze a track and get basic recommendations |
| `/api/recommend` | POST | Get weighted recommendations using embeddings |
| `/api/track/lyrics` | POST | Fetch lyrics for a track |
| `/api/embed/lyrics` | POST | Generate embedding vector for lyrics |
| `/api/playlist/create` | POST | Create a Spotify playlist with selected tracks |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js authentication routes |

> See `docs/api.md` for complete API documentation with request/response formats.

---

## 🧹 Data Pipeline & Embeddings

1. **Lyrics Retrieval** – Lyrics are fetched from Genius API (or scraped) and cleaned (removes timestamps, annotations).

2. **Embedding Generation** – Cleaned lyrics are sent to OpenAI's embedding API to generate 3072-dimensional vectors.

3. **Caching** – Embeddings are cached in-memory (will migrate to PostgreSQL + pgvector for persistence).

4. **Similarity Calculation** – Cosine similarity is computed between source and candidate embeddings.

5. **Audio Features** – Spotify's audio features API provides normalized metrics for each track.

6. **Scoring & Ranking** – Weighted scores are calculated and tracks are sorted by similarity.

> Currently using in-memory caching. Production will use PostgreSQL with pgvector extension for efficient vector similarity search.

---

## 🎨 UI Notes

- **Space Grotesk** font used throughout for a modern, clean aesthetic.
- **Interactive nebula shader** background provides visual depth.
- **Animated text** component for the "Echoes" logo with gradient effects.
- **Translucent navbar** with backdrop blur for a floating effect.
- **Split-panel layout** for selected track and recommendations.
- **Modal dialogs** for playlist creation with track selection.
- **Loading skeletons** and empty states for better UX.
- **Mobile responsive** design with Tailwind breakpoints.

---

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed production deployment instructions.

**Quick Deploy Checklist:**

- [ ] Set all environment variables in Vercel
- [ ] Update Spotify redirect URI to production domain
- [ ] Configure PostgreSQL database with pgvector
- [ ] Set up Redis for caching (optional)
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Test OAuth flow on production domain

---

## 🐞 Troubleshooting

| Issue | What to check |
|-------|---------------|
| Spotify OAuth fails with "Invalid redirect URI" | Verify redirect URI in Spotify Dashboard matches exactly: `http://127.0.0.1:3000/api/auth/callback/spotify` (use `127.0.0.1`, not `localhost`) |
| "Access denied (403)" from Spotify API | Check if your app is in Development Mode—add your email to the Users and Access whitelist, or request Extended Quota Mode |
| Audio features endpoint returns 403 | Your Spotify app may have restrictions. See `TROUBLESHOOTING.md` for detailed steps |
| Recommendations API returns 404 | The route automatically retries without `seed_artists` if the initial request fails |
| "Failed to get recommendations" | Check server logs for detailed error messages. Token may need refreshing—try signing out and back in |
| Lyrics not available | Genius API integration is basic—lyrics may not be available for all tracks. This is optional and won't block recommendations |
| Embeddings not working | Verify `OPENAI_API_KEY` is set correctly and has sufficient credits |

---

## 📚 Documentation

- **`NEXT_STEPS.md`** – Detailed development roadmap and setup instructions
- **`docs/api.md`** – Complete API documentation
- **`DEPLOYMENT.md`** – Production deployment guide
- **`design.md`** – System architecture and technical design
- **`TROUBLESHOOTING.md`** – Common issues and solutions
- **`IMPLEMENTATION_STATUS.md`** – Feature completion tracking

---

## 🔮 Future Enhancements

- **Audio embeddings** – Python microservice for extracting melodic fingerprints
- **Database persistence** – PostgreSQL + pgvector for efficient vector search
- **Redis caching** – Improved performance for embeddings and API responses
- **Batch processing** – Pre-compute embeddings for popular tracks
- **User playlists** – Save and manage recommendation playlists
- **Collaborative filtering** – Recommendations based on similar user preferences

---

This project is currently private and intended for internal prototyping.
