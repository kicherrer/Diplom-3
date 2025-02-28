/*
  # Add achievements system

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, not null)
      - `icon` (text, not null)
      - `points` (integer, not null)
      - `criteria_type` (text, not null)
      - `criteria_value` (integer, not null)
      - `is_hidden` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `achievement_id` (uuid, references achievements.id)
      - `progress` (integer, default 0)
      - `completed` (boolean, default false)
      - `completed_at` (timestamptz, null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Profile Updates
    - Add `banner_url` to profiles table
    - Add `points` to profiles table
    - Add `last_active_at` to profiles table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update achievements"
  ON achievements FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can delete achievements"
  ON achievements FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements"
  ON user_achievements FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update user achievements"
  ON user_achievements FOR UPDATE
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER set_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert some default achievements
INSERT INTO achievements (name, description, icon, points, criteria_type, criteria_value, is_hidden)
VALUES
  ('Welcome!', 'Create your account and join MediaVault', 'UserPlus', 10, 'registration', 1, false),
  ('Movie Buff', 'Watch 10 movies', 'Film', 20, 'movies_watched', 10, false),
  ('TV Enthusiast', 'Watch 5 TV shows', 'Tv', 20, 'shows_watched', 5, false),
  ('Critic', 'Write 5 reviews', 'MessageSquare', 15, 'reviews_written', 5, false),
  ('Explorer', 'Add 20 items to your watchlist', 'List', 25, 'watchlist_items', 20, false),
  ('Perfectionist', 'Rate 50 media items', 'Star', 30, 'items_rated', 50, false),
  ('Early Bird', 'Be one of the first 100 users', 'Award', 50, 'user_number', 100, true);