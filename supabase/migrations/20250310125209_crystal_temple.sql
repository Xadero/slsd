/*
  # Add player statistics columns

  1. Changes
    - Add new columns to player_rankings table for tracking detailed statistics
    - Add default values for new columns to ensure backward compatibility
    - Update existing rows with default values

  2. New Columns
    - tournament_points: Array of points from each tournament
    - total_180s: Count of 180s scored
    - total_171s: Count of 171s scored
    - highest_finish: Highest checkout score
    - best_leg: Best leg score
    - leg_difference: Difference between won and lost legs
    - matches_played: Total matches played
    - legs_played: Total legs played
    - legs_won: Total legs won
    - matches_won: Total matches won
*/

ALTER TABLE player_rankings
ADD COLUMN IF NOT EXISTS tournament_points integer[] DEFAULT array[]::integer[],
ADD COLUMN IF NOT EXISTS total_180s integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_171s integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS highest_finish integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_leg integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS leg_difference integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legs_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legs_won integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_won integer DEFAULT 0;