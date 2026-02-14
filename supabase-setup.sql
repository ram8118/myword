-- Run this SQL in your Supabase Dashboard > SQL Editor
-- This creates the tables needed for the AI Dictionary app

CREATE TABLE IF NOT EXISTS words (
  word TEXT PRIMARY KEY,
  ipa TEXT NOT NULL DEFAULT '',
  meanings JSONB NOT NULL DEFAULT '[]'::jsonb,
  phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  origin_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  translation JSONB NOT NULL DEFAULT '{}'::jsonb,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
