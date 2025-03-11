/*
  # Update player rankings table with additional statistics

  1. Changes
    - Add new columns to player_rankings table for storing additional statistics:
      - tournament_points (array of points from each tournament)
      - total_180s (count of 180s scored)
      - total_171s (count of 171s scored)
      - highest_finish (highest checkout)
      - best_leg (best leg score)
      - leg_difference (difference between won and lost legs)
      - matches_played (total matches played)
      - legs_played (total legs played)
      - legs_won (total legs won)
      - matches_won (total matches won)

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to player_rankings table
ALTER TABLE player_rankings 
ADD COLUMN IF NOT EXISTS tournament_points integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_180s integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_171s integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS highest_finish integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_leg integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS leg_difference integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legs_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legs_won integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_won integer DEFAULT 0;