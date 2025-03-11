export interface Player {
  id: number;
  name: string;
  totalPoints: number;
}

export interface MatchStatistics {
  count180s: number;
  count171s: number;
  highestFinish: number;
  bestLeg: number;
}

export interface Match {
  id: number;
  player1: Player;
  player2: Player;
  player1Score?: number;
  player2Score?: number;
  completed: boolean;
  groupId?: number;
  round?: string;
  player1Stats?: MatchStatistics;
  player2Stats?: MatchStatistics;
  showStats?: boolean;
}

export interface Group {
  id: number;
  players: Player[];
  matches: Match[];
}

export interface Tournament {
  id: number;
  name: string;
  date: Date;
  participants: Player[];
  groups: Group[];
  knockoutMatches: Match[];
  completed: boolean;
  knockoutStageStarted: boolean;
}

export interface PlayerStanding {
  player: Player;
  matches: number;
  wins: number;
  losses: number;
  points: number;
}

export interface PlayerRanking {
  player: Player;
  totalPoints: number;
  rankChange: number;
  currentRank: number;
  tournamentPoints: number[];
  total180s: number;
  total171s: number;
  highestFinish: number;
  bestLeg: number;
  legDifference: number;
  matchesPlayed: number;
  legsPlayed: number;
  legsWon: number;
  matchesWon: number;
  wonLegsPercentage: number;
  wonMatchesPercentage: number;
}

export interface DatabasePlayerRanking {
  player_id: number;
  player_name: string;
  total_points: number;
  rank_change: number;
  tournament_points: number[];
  total_180s: number;
  total_171s: number;
  highest_finish: number;
  best_leg: number;
  leg_difference: number;
  matches_played: number;
  legs_played: number;
  legs_won: number;
  matches_won: number;
}

export interface PlayerTournamentStats {
  total180s: number;
  total171s: number;
  highestFinish: number;
  bestLeg: number;
  averageFinish: number;
}