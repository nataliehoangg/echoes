![Echoes hero screenshot placeholder](./public/next.svg)

# Echoes · Emotion-Level Song Discovery

Echoes is an AI-assisted music discovery project designed for listeners who live inside the songs they love. The app blends lyric intent, melodic fingerprint, and Spotify sentiment into a weighted similarity score, then generates `_alikes` playlists directly in a user’s Spotify account.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS (v4), Framer Motion (planned)
- **Backend:** Next.js API routes, Node.js services, PostgreSQL + `pgvector`, Redis queues
- **AI & Data:** OpenAI embeddings for lyrics, Python audio embeddings (Essentia/Librosa), Spotify audio analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account
- OpenAI API Key
- Genius API credentials (optional, for lyrics)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd echoes
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://127.0.0.1:3000

# OpenAI
OPENAI_API_KEY=your_openai_key

# Genius (optional)
GENIUS_ACCESS_TOKEN=your_genius_token
GENIUS_CLIENT_ID=your_genius_client_id
GENIUS_CLIENT_SECRET=your_genius_client_secret
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://127.0.0.1:3000 in your browser

### Spotify Setup

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret to `.env.local`
5. If in Development Mode, add your email to the Users and Access whitelist

See `NEXT_STEPS.md` for detailed setup instructions.

## Project Structure

```
src/
  app/
    api/              # API routes
      auth/           # NextAuth configuration
      search/         # Spotify search
      track/          # Track analysis and lyrics
      embed/          # Embedding generation
      recommend/      # Weighted recommendations
      playlist/       # Playlist creation
    about/            # About page
    layout.tsx        # Root layout with providers
    page.tsx          # Homepage with search
    globals.css       # Global styles
  components/         # React components
  server/             # Server utilities (OpenAI, DB)
  lib/                # Shared utilities
```

## Features

- ✅ Spotify OAuth authentication
- ✅ Track search with autocomplete
- ✅ Similarity analysis using Spotify recommendations
- ✅ Weighted recommendations (lyrics, audio, vibe)
- ✅ Lyrics fetching and embedding generation
- ✅ Playlist creation with track selection
- ✅ Responsive UI with animations

## API Documentation

See `docs/api.md` for complete API documentation.

## Deployment

See `DEPLOYMENT.md` for production deployment instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify app client secret |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth |
| `NEXTAUTH_URL` | Yes | App URL (http://127.0.0.1:3000 for dev) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `GENIUS_ACCESS_TOKEN` | No | Genius API token for lyrics |
| `GENIUS_CLIENT_ID` | No | Genius API client ID |
| `GENIUS_CLIENT_SECRET` | No | Genius API client secret |
| `POSTGRES_URL` | No | Database connection string (for production) |
| `REDIS_URL` | No | Redis connection string (for caching) |

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Architecture

See `design.md` for system architecture and roadmap.

## Troubleshooting

### Spotify 403 Errors

If you get 403 errors from Spotify API:
1. Check your app is not in Development Mode with restrictions
2. Add your email to the Users and Access whitelist
3. Wait a few minutes for changes to propagate
4. Sign out and sign back in

See `TROUBLESHOOTING.md` for more help.

## License

This project is currently private and intended for internal prototyping.

## Scripts

- `npm run dev` – start local development server
- `npm run build` – create a production build
- `npm run start` – run the production build locally
- `npm run lint` – run ESLint against the project

## License

This project is currently private and intended for internal prototyping. Reach out at hello@echoes.app for collaboration inquiries.
