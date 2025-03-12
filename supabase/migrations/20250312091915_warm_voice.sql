/*
  # Add tournament series support

  1. New Tables
    - `tournament_series`: Stores tournament series data
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add series_id to tournaments table
    - Add foreign key constraint

  3. Security
    - Enable RLS on tournament_series table
    - Add policies for authenticated users
*/

-- Create tournament series table
CREATE TABLE IF NOT EXISTS tournament_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add series_id to tournaments table
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES tournament_series(id);

-- Enable RLS
ALTER TABLE tournament_series ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all users"
  ON tournament_series
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON tournament_series
  FOR INSERT
  TO authenticated
  WITH CHECK (true);