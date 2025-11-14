# Echoes API Documentation

This document describes all API endpoints in the Echoes application.

## Authentication

All API endpoints (except `/api/auth/*`) require authentication via NextAuth session. Include the session cookie in requests.

## Endpoints

### Search Tracks

**GET** `/api/search`

Search for tracks on Spotify.

**Query Parameters:**
- `q` (string, required): Search query

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "artist": "string",
      "album": "string",
      "albumArt": "string",
      "previewUrl": "string | null",
      "spotifyUrl": "string"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing query parameter
- `401`: Unauthorized

---

### Analyze Track

**POST** `/api/track/analyze`

Analyze a track and find similar recommendations using Spotify's recommendation API.

**Request Body:**
```json
{
  "trackId": "string"
}
```

**Response:**
```json
{
  "similarTracks": [
    {
      "id": "string",
      "title": "string",
      "artist": "string",
      "album": "string",
      "albumArt": "string",
      "previewUrl": "string | null",
      "spotifyUrl": "string"
    }
  ],
  "analysis": {
    "audioFeatures": {
      "danceability": 0.5,
      "energy": 0.7,
      "valence": 0.6,
      "tempo": 120
    },
    "lyricsFetched": false,
    "method": "spotify_recommendations"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing trackId
- `401`: Unauthorized
- `403`: Access denied (Spotify API restrictions)

---

### Get Recommendations

**POST** `/api/recommend`

Get recommendations using weighted similarity (lyrics, audio, Spotify features).

**Request Body:**
```json
{
  "trackId": "string",
  "limit": 20,
  "weights": {
    "lyrics": 0.5,
    "audio": 0.35,
    "spotify": 0.15
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "string",
      "title": "string",
      "artist": "string",
      "album": "string",
      "albumArt": "string",
      "previewUrl": "string | null",
      "spotifyUrl": "string",
      "score": 0.85,
      "breakdown": {
        "lyrics": 0.4,
        "spotify": 0.3,
        "audio": 0.15
      }
    }
  ],
  "sourceTrackId": "string",
  "weights": {
    "lyrics": 0.5,
    "audio": 0.35,
    "spotify": 0.15
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing trackId
- `401`: Unauthorized
- `500`: Internal server error

---

### Get Lyrics

**POST** `/api/track/lyrics`

Fetch lyrics for a track.

**Request Body:**
```json
{
  "trackId": "string",
  "title": "string",
  "artist": "string"
}
```

**Response:**
```json
{
  "lyrics": "string",
  "cached": false
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Lyrics not available
- `500`: Internal server error

---

### Generate Lyrics Embedding

**POST** `/api/embed/lyrics`

Generate an embedding vector for lyrics using OpenAI.

**Request Body:**
```json
{
  "lyrics": "string"
}
```

**Response:**
```json
{
  "embedding": [0.1, 0.2, ...],
  "dimensions": 3072,
  "model": "text-embedding-3-large"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing or invalid lyrics
- `500`: Internal server error

---

### Create Playlist

**POST** `/api/playlist/create`

Create a Spotify playlist with selected tracks.

**Request Body:**
```json
{
  "trackId": "string",
  "similarTrackIds": ["string"],
  "name": "string"
}
```

**Response:**
```json
{
  "playlistId": "string",
  "playlistUrl": "string",
  "success": true
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Internal server error

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message",
  "details": {}
}
```

## Rate Limiting

API endpoints are rate-limited to 60 requests per minute per IP address. When rate limited, you'll receive:

```json
{
  "error": "Too many requests. Please try again later."
}
```

Status code: `429`

