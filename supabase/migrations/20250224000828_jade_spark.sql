/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `media_items`
      - `id` (uuid, primary key)
      - `tmdb_id` (integer)
      - `title` (text)
      - `type` (text) - movie, tv, documentary
      - `poster_url` (text)
      - `release_date` (date)
      - `overview` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_media_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `media_item_id` (uuid, references media_items)
      - `status` (text) - watched, watching, plan_to_watch
      - `rating` (integer)
      - `review` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_items table
CREATE TABLE media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer UNIQUE NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('movie', 'tv', 'documentary')),
  poster_url text,
  release_date date,
  overview text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_media_items table
CREATE TABLE user_media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_item_id uuid REFERENCES media_items(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('watched', 'watching', 'plan_to_watch')),
  rating integer CHECK (rating >= 1 AND rating <= 10),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, media_item_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Media items are viewable by everyone"
  ON media_items FOR SELECT
  USING (true);

CREATE POLICY "Users can view their media items"
  ON user_media_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their media items"
  ON user_media_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their media items"
  ON user_media_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their media items"
  ON user_media_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_user_media_items_updated_at
  BEFORE UPDATE ON user_media_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();