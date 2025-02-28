/*
  # Add admin field to profiles table

  1. Changes
    - Add `is_admin` boolean column to profiles table with default false
    - Add policy to allow admins to update other users' admin status
*/

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create policy for admin management
CREATE POLICY "Admins can update other users' admin status"
  ON profiles
  FOR UPDATE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );