/*
  # Create league registrations table

  1. New Tables
    - `league_registrations`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `surname` (text, not null)
      - `phone_number` (text, unique, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on league_registrations table
    - Add policies for authenticated users to read and insert
*/

-- Create league registrations table
CREATE TABLE IF NOT EXISTS league_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  surname text NOT NULL,
  phone_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE league_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all users"
  ON league_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON league_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);