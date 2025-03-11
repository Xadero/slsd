/*
  # Create tournament database schema

  1. New Tables
    - `tournaments`: Stores tournament data
      - `id` (uuid, primary key)
      - `name` (text)
      - `date` (timestamp)
      - `data` (jsonb) - Stores complete tournament data
      - `completed` (boolean)
    
    - `player_rankings`: Stores player rankings
      - `player_id` (bigint, primary key)
      - `player_name` (text)
      - `total_points` (integer)
      - `rank_change` (integer)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date timestamptz DEFAULT now(),
  data jsonb NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create player rankings table
CREATE TABLE IF NOT EXISTS player_rankings (
  player_id bigint PRIMARY KEY,
  player_name text NOT NULL,
  total_points integer DEFAULT 0,
  rank_change integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all users"
  ON tournaments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON tournaments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read access to all users"
  ON player_rankings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow update access to all users"
  ON player_rankings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_rankings_updated_at
  BEFORE UPDATE ON player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();