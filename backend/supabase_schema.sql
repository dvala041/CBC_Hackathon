-- Supabase SQL commands to create/update the videos table

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if you want to start fresh (WARNING: This deletes all data!)
-- DROP TABLE IF EXISTS videos CASCADE;

-- Create videos table with all required fields
-- id = unique video identifier, user_id = which user saved it
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Unique ID for each video
    user_id UUID NOT NULL REFERENCES auth.users(id),  -- FK to auth.users table
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT,  -- One sentence summary
    notes JSONB,   -- Array of detailed notes stored as JSON
    thumbnail TEXT,  -- Optional thumbnail URL
    transcription TEXT,  -- Full transcription
    category TEXT,
    duration FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries (since we'll query by user often)
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can do everything" ON videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;

-- Allow service role to bypass RLS (for backend API operations)
CREATE POLICY "Service role can do everything" ON videos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for authenticated users to access their own videos
CREATE POLICY "Users can view their own videos" ON videos
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON videos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON videos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
