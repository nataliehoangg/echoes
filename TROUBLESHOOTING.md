# Troubleshooting: Spotify 403 Error on Audio Features

## Problem
You're getting a 403 Forbidden error when trying to access Spotify's audio features endpoint, even though:
- Your token refresh is working
- Search API calls work fine
- You've signed out and back in

## Root Cause
This is almost certainly because your Spotify app is in **Development Mode** with user restrictions. In Development Mode, Spotify restricts which users can access certain endpoints, even with valid tokens.

## Solution

### Step 1: Check Your App Mode
1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Look at the top of the page - does it say "Development Mode" or "Extended Quota Mode"?

### Step 2: If in Development Mode
You have two options:

#### Option A: Add Yourself to Whitelist (Quick Fix)
1. In your app settings, scroll to "Users and Access"
2. Click "Add User"
3. Enter your Spotify account email (the one you use to sign in)
4. Save
5. Sign out and sign back in to your app
6. Try again

#### Option B: Submit for Extended Quota Mode (Recommended for Production)
1. In your app settings, look for "Request Extended Quota Mode" or similar
2. Fill out the form explaining your use case
3. Wait for approval (can take a few days)
4. Once approved, your app will work for all users

### Step 3: Verify It's Fixed
After adding yourself to the whitelist or getting Extended Quota Mode:
1. Sign out completely
2. Clear browser cookies
3. Sign back in
4. Try searching for a song and analyzing it

## Why This Happens
- **Development Mode**: Spotify restricts access to prevent abuse. Only whitelisted users can use the app.
- **Audio Features Endpoint**: This endpoint may have stricter restrictions than search, which is why search works but audio features doesn't.
- **Token Validity**: Your token is valid (that's why search works), but Spotify is blocking the request based on app-level restrictions.

## Alternative: Test with Different Track
Sometimes specific tracks can cause issues. Try:
- A very popular track (like "Blinding Lights" by The Weeknd)
- A track from a major label artist
- A track that's been on Spotify for a while

## Still Not Working?
If you've:
1. ✅ Added yourself to the whitelist
2. ✅ Signed out and back in
3. ✅ Tried different tracks
4. ✅ Verified your app settings

Then check:
- Your redirect URI matches exactly: `http://127.0.0.1:3000/api/auth/callback/spotify`
- Your app description mentions you're using the Web API
- You haven't exceeded rate limits (check the dashboard for quota usage)

## Need More Help?
Check the Spotify Developer Forums: https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer

