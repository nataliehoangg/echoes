/**
 * Database client and utilities
 * 
 * This file provides a structure for database operations.
 * For production, you'll need to:
 * 1. Set up PostgreSQL with pgvector extension
 * 2. Install @vercel/postgres or pg library
 * 3. Configure connection string in .env.local
 * 
 * Example setup:
 * ```bash
 * # Install dependencies
 * npm install @vercel/postgres
 * # or
 * npm install pg
 * ```
 * 
 * Environment variables needed:
 * - POSTGRES_URL (connection string)
 * - POSTGRES_PRISMA_URL (if using Prisma)
 * - POSTGRES_URL_NON_POOLING (for migrations)
 */

// Placeholder for database client
// Replace with actual implementation when database is set up
export const db = {
  // Example: query function
  async query<T = unknown>(_sql: string, _params?: unknown[]): Promise<T[]> {
    // TODO: Implement actual database query
    console.warn("Database not configured. Using in-memory storage.");
    return [];
  },

  // Example: insert function
  async insert(_table: string, _data: Record<string, unknown>): Promise<void> {
    // TODO: Implement actual database insert
    console.warn("Database not configured. Using in-memory storage.");
  },
};

/**
 * Database schema (to be created in PostgreSQL)
 * 
 * Run these SQL commands in your PostgreSQL database:
 * 
 * -- Enable pgvector extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 * 
 * -- Users table
 * CREATE TABLE IF NOT EXISTS users (
 *   id TEXT PRIMARY KEY,
 *   spotify_id TEXT UNIQUE NOT NULL,
 *   email TEXT,
 *   display_name TEXT,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Tracks table
 * CREATE TABLE IF NOT EXISTS tracks (
 *   id TEXT PRIMARY KEY,
 *   spotify_id TEXT UNIQUE NOT NULL,
 *   title TEXT NOT NULL,
 *   artist TEXT NOT NULL,
 *   album TEXT,
 *   album_art_url TEXT,
 *   preview_url TEXT,
 *   spotify_url TEXT,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Lyrics embeddings table
 * CREATE TABLE IF NOT EXISTS lyrics_embeddings (
 *   track_id TEXT PRIMARY KEY REFERENCES tracks(id),
 *   embedding vector(3072) NOT NULL,
 *   lyrics_text TEXT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Audio embeddings table (for future use)
 * CREATE TABLE IF NOT EXISTS audio_embeddings (
 *   track_id TEXT PRIMARY KEY REFERENCES tracks(id),
 *   embedding vector(128) NOT NULL, -- Adjust size based on audio embedding model
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Spotify features table
 * CREATE TABLE IF NOT EXISTS spotify_features (
 *   track_id TEXT PRIMARY KEY REFERENCES tracks(id),
 *   danceability FLOAT,
 *   energy FLOAT,
 *   key INTEGER,
 *   loudness FLOAT,
 *   mode INTEGER,
 *   speechiness FLOAT,
 *   acousticness FLOAT,
 *   instrumentalness FLOAT,
 *   liveness FLOAT,
 *   valence FLOAT,
 *   tempo FLOAT,
 *   time_signature INTEGER,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Recommendation logs table
 * CREATE TABLE IF NOT EXISTS recommendation_logs (
 *   id SERIAL PRIMARY KEY,
 *   user_id TEXT REFERENCES users(id),
 *   source_track_id TEXT REFERENCES tracks(id),
 *   recommended_track_ids TEXT[],
 *   weights JSONB, -- Store user-defined weights
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Create indexes for vector similarity search
 * CREATE INDEX IF NOT EXISTS lyrics_embeddings_vector_idx 
 *   ON lyrics_embeddings 
 *   USING ivfflat (embedding vector_cosine_ops);
 * 
 * CREATE INDEX IF NOT EXISTS audio_embeddings_vector_idx 
 *   ON audio_embeddings 
 *   USING ivfflat (embedding vector_cosine_ops);
 */

