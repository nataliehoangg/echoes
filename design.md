# Echoes Design Notes

## System Architecture

### Client
- Next.js App Router single-page experience
- TailwindCSS + (future) Framer Motion for fluid UI
- Spotify embed and recommendation controls
- Secure session management and weight sliders

### Backend
- Node.js API routes as an authenticated gateway
- Spotify OAuth token exchange & refresh middleware
- Song data aggregator combining Spotify audio analysis and lyrics
- Scoring engine and playlist creation service

### Intelligence Layer
- OpenAI text embeddings for lyric meaning
- Python audio service (Essentia/Librosa) for melodic fingerprints
- Spotify feature projector for valence/energy vectors
- Weighted similarity blending per user-defined weights

### Data & Infra
- PostgreSQL with `pgvector` extension for unified metadata + vectors
- Redis for request caching, background queues, and rate limiting
- Vector index tuned for cosine and Euclidean similarity
- Observability via OpenTelemetry traces and Grafana dashboards

## Development Roadmap

### MVP · Weeks 1–2
- Baseline Next.js shell + Tailwind design system
- Spotify login and secure token storage
- Lyrics ingestion and OpenAI embedding generation
- Vector search for lyric-only similarity and playlist export

### V1 · Weeks 3–6
- Python audio microservice connected via Redis queue
- Weighted scoring engine across lyric, melody, and vibe signals
- Framer Motion micro-interactions for exploratory UI
- Playlist history views and saved tuner presets

### Beyond · Weeks 7+
- Production-grade observability and alerting
- Feedback-driven similarity refinement loops
- Community playlists and emotional timelines
- Mobile app and browser extension experiments

