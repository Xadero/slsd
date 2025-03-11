import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tournament, Player, Group, Match, PlayerStanding, PlayerRanking } from '../models/tournament.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private currentTournament = new BehaviorSubject<Tournament | null>(null);
  private tournamentHistory = new BehaviorSubject<Tournament[]>([]);
  private playerRankings = new BehaviorSubject<PlayerRanking[]>([]);
  private readonly CURRENT_TOURNAMENT_KEY = 'currentTournament';

  constructor(private supabaseService: SupabaseService) {
    this.loadInitialData();
    this.loadSavedTournament();
  }

  private async loadInitialData() {
    try {
      const [tournaments, rankings] = await Promise.all([
        this.supabaseService.getTournaments(),
        this.supabaseService.getPlayerRankings()
      ]);

      this.tournamentHistory.next(tournaments.map(t => ({
        ...t.data,
        id: t.id,
        name: t.name,
        date: new Date(t.date)
      })));

      const sortedRankings = rankings
        .sort((a, b) => b.total_points - a.total_points)
        .map((r, index) => ({
          player: {
            id: r.player_id,
            name: r.player_name,
            totalPoints: r.total_points
          },
          totalPoints: r.total_points,
          rankChange: r.rank_change,
          currentRank: index + 1,
          tournamentPoints: r.tournament_points || [],
          total180s: r.total_180s || 0,
          total171s: r.total_171s || 0,
          highestFinish: r.highest_finish || 0,
          bestLeg: r.best_leg || 0,
          legDifference: r.leg_difference || 0,
          matchesPlayed: r.matches_played || 0,
          legsPlayed: r.legs_played || 0,
          legsWon: r.legs_won || 0,
          matchesWon: r.matches_won || 0,
          wonLegsPercentage: r.legs_played ? (r.legs_won / r.legs_played) * 100 : 0,
          wonMatchesPercentage: r.matches_played ? (r.matches_won / r.matches_played) * 100 : 0
        }));

      this.playerRankings.next(sortedRankings);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  private loadSavedTournament() {
    const savedTournament = localStorage.getItem(this.CURRENT_TOURNAMENT_KEY);
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament);
      tournament.date = new Date(tournament.date);
      this.currentTournament.next(tournament);
    }
  }

  private saveTournamentToStorage(tournament: Tournament | null) {
    if (tournament) {
      localStorage.setItem(this.CURRENT_TOURNAMENT_KEY, JSON.stringify(tournament));
    } else {
      localStorage.removeItem(this.CURRENT_TOURNAMENT_KEY);
    }
  }

  createTournament(name: string, participants: Player[]): void {
    const groups = this.createGroups(participants);
    const tournament: Tournament = {
      id: Date.now(),
      name,
      date: new Date(),
      participants,
      groups,
      knockoutMatches: [],
      completed: false,
      knockoutStageStarted: false
    };
    this.currentTournament.next(tournament);
    this.saveTournamentToStorage(tournament);
  }

  private createGroups(participants: Player[]): Group[] {
    const numParticipants = participants.length;
    let numGroups: number;

    // Determine optimal number of groups based on participant count
    if (numParticipants <= 8) numGroups = 2;
    else if (numParticipants <= 16) numGroups = 4;
    else numGroups = 8;

    // Create a copy of participants and shuffle them
    const shuffledPlayers = [...participants].sort(() => Math.random() - 0.5);

    // Calculate players per group with front-loading
    const playersPerGroup: number[] = Array(numGroups).fill(0);
    let remainingPlayers = numParticipants;
    let currentGroup = 0;

    // First, ensure minimum players per group (2)
    for (let i = 0; i < numGroups; i++) {
      playersPerGroup[i] = 2;
      remainingPlayers -= 2;
    }

    // Distribute remaining players to groups from start to end
    while (remainingPlayers > 0) {
      playersPerGroup[currentGroup]++;
      remainingPlayers--;
      currentGroup = (currentGroup + 1) % numGroups;
    }

    // Create groups with calculated distribution
    const groups: Group[] = [];
    let playerIndex = 0;

    for (let i = 0; i < numGroups; i++) {
      const groupPlayers = shuffledPlayers.slice(playerIndex, playerIndex + playersPerGroup[i]);
      playerIndex += playersPerGroup[i];

      groups.push({
        id: i,
        players: groupPlayers,
        matches: this.createGroupMatches(groupPlayers, i)
      });
    }

    return groups;
  }

  private createGroupMatches(players: Player[], groupId: number): Match[] {
    const matches: Match[] = [];
    const matchOrder = [
      [0, 5], // 1-6
      [4, 1], // 5-2
      [3, 2], // 4-3
      [4, 0], // 5-1
      [5, 2], // 6-3
      [1, 3], // 2-4
      [2, 4], // 3-5
      [3, 5], // 4-6
      [0, 2], // 1-3
      [5, 4], // 6-5
      [2, 1], // 3-2
      [3, 0], // 4-1
      [1, 5], // 2-6
      [4, 3], // 5-4
      [0, 1]  // 1-2
    ];

    // Create matches according to the specified order
    matchOrder.forEach(([p1Index, p2Index], matchIndex) => {
      // Skip if either player doesn't exist
      if (p1Index >= players.length || p2Index >= players.length) {
        return;
      }

      matches.push({
        id: Date.now() + matchIndex,
        player1: players[p1Index],
        player2: players[p2Index],
        completed: false,
        groupId,
        showStats: false,
        player1Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0
        },
        player2Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0
        }
      });
    });

    return matches;
  }

  updateMatchResult(match: Match, player1Score: number, player2Score: number): void {
    const tournament = this.currentTournament.value;
    if (!tournament) return;

    const updatedTournament = { ...tournament };
    
    if (match.groupId !== undefined) {
      updatedTournament.groups = tournament.groups.map(group => {
        if (group.id === match.groupId) {
          return {
            ...group,
            matches: group.matches.map(m => 
              m.id === match.id ? { ...m, player1Score, player2Score, completed: true } : m
            )
          };
        }
        return group;
      });
    } else {
      const updatedMatches = [...tournament.knockoutMatches];
      const matchIndex = updatedMatches.findIndex(m => m.id === match.id);
      
      if (matchIndex !== -1) {
        updatedMatches[matchIndex] = { ...match, player1Score, player2Score, completed: true };
        
        const currentRound = match.round;
        if (currentRound === 'Quarter-Finals' || currentRound === 'Semi-Finals') {
          const winner = player1Score > player2Score ? match.player1 : match.player2;
          this.createNextRoundMatch(updatedMatches, winner, currentRound, matchIndex);
        }
      }
      
      updatedTournament.knockoutMatches = updatedMatches;
    }

    this.currentTournament.next(updatedTournament);
    this.saveTournamentToStorage(updatedTournament);
    this.checkAndStartKnockoutStage(updatedTournament);
  }

  private createNextRoundMatch(matches: Match[], winner: Player, currentRound: string, matchIndex: number): void {
    const nextRound = currentRound === 'Quarter-Finals' ? 'Semi-Finals' : 'Final';
    const pairIndex = Math.floor(matchIndex / 2);
    
    const isSecondWinner = matchIndex % 2 === 1;
    if (isSecondWinner) {
      const previousWinner = matches
        .filter(m => m.round === currentRound)
        .find((_, idx) => Math.floor(idx / 2) === pairIndex)?.player1;
      
      if (previousWinner) {
        matches.push({
          id: Date.now(),
          player1: previousWinner,
          player2: winner,
          completed: false,
          round: nextRound
        });
      }
    } else {
      const existingNextRoundMatch = matches.find(m => 
        m.round === nextRound && 
        (m.player1.id === winner.id || m.player2.id === winner.id)
      );
      
      if (!existingNextRoundMatch) {
        matches.push({
          id: Date.now(),
          player1: winner,
          player2: winner,
          completed: false,
          round: nextRound
        });
      }
    }
  }

  private checkAndStartKnockoutStage(tournament: Tournament): void {
    if (tournament.knockoutStageStarted || !this.areGroupMatchesCompleted(tournament)) return;

    const qualifiedPlayers = this.getQualifiedPlayers(tournament);
    const knockoutMatches = this.createInitialKnockoutMatches(qualifiedPlayers);

    const updatedTournament = {
      ...tournament,
      knockoutMatches,
      knockoutStageStarted: true
    };

    this.currentTournament.next(updatedTournament);
    this.saveTournamentToStorage(updatedTournament);
  }

  private areGroupMatchesCompleted(tournament: Tournament): boolean {
    return tournament.groups.every(group =>
      group.matches.every(match => match.completed)
    );
  }

  private getQualifiedPlayers(tournament: Tournament): Player[] {
    const qualifiedPlayers: Player[] = [];
    
    tournament.groups.forEach(group => {
      const standings = this.getGroupStandings(group);
      qualifiedPlayers.push(...standings.slice(0, 2).map(standing => standing.player));
    });

    if (qualifiedPlayers.length < 8) {
      const thirdPlacedPlayers = tournament.groups
        .map(group => this.getGroupStandings(group)[2])
        .sort((a, b) => b.points - a.points)
        .map(standing => standing.player);
      
      qualifiedPlayers.push(...thirdPlacedPlayers.slice(0, 8 - qualifiedPlayers.length));
    }

    return qualifiedPlayers;
  }

  private createInitialKnockoutMatches(players: Player[]): Match[] {
    const matches: Match[] = [];
    const quarterFinalPairings = this.createQuarterFinalPairings(players);
    
    quarterFinalPairings.forEach(([player1, player2]) => {
      matches.push({
        id: Date.now() + matches.length,
        player1,
        player2,
        completed: false,
        round: 'Quarter-Finals',
        showStats: false
      });
    });

    return matches;
  }

  private createQuarterFinalPairings(players: Player[]): [Player, Player][] {
    const seededPlayers = [...players].sort((a, b) => {
      const aPoints = this.getPlayerGroupPoints(a);
      const bPoints = this.getPlayerGroupPoints(b);
      return bPoints - aPoints;
    });

    const pairings: [Player, Player][] = [
      [seededPlayers[0], seededPlayers[7]],
      [seededPlayers[3], seededPlayers[4]],
      [seededPlayers[1], seededPlayers[6]],
      [seededPlayers[2], seededPlayers[5]]
    ];

    return pairings;
  }

  private getPlayerGroupPoints(player: Player): number {
    const tournament = this.currentTournament.value;
    if (!tournament) return 0;

    const group = tournament.groups.find(g => g.players.some(p => p.id === player.id));
    if (!group) return 0;

    const standing = this.getGroupStandings(group).find(s => s.player.id === player.id);
    return standing ? standing.points : 0;
  }

  getGroupStandings(group: Group): PlayerStanding[] {
    return group.players.map(player => {
      const matches = group.matches.filter(m => 
        m.player1.id === player.id || m.player2.id === player.id
      );
      
      const wins = matches.filter(m => 
        (m.player1.id === player.id && m.player1Score! > m.player2Score!) ||
        (m.player2.id === player.id && m.player2Score! > m.player1Score!)
      ).length;

      const completedMatches = matches.filter(m => m.completed).length;

      return {
        player,
        matches: completedMatches,
        wins,
        losses: completedMatches - wins,
        points: wins * 2
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.wins / b.matches) - (a.wins / a.matches);
    });
  }

  private calculatePlayerStatistics(player: Player, tournament: Tournament) {
    let total180s = 0;
    let total171s = 0;
    let highestFinish = 0;
    let bestLeg = 0;
    let legsPlayed = 0;
    let legsWon = 0;
    let matchesPlayed = 0;
    let matchesWon = 0;

    // Calculate from group matches
    tournament.groups.forEach(group => {
      group.matches.forEach(match => {
        if (!match.completed) return;

        if (match.player1.id === player.id) {
          matchesPlayed++;
          if (match.player1Score! > match.player2Score!) matchesWon++;
          
          if (match.player1Stats) {
            total180s += match.player1Stats.count180s || 0;
            total171s += match.player1Stats.count171s || 0;
            highestFinish = Math.max(highestFinish, match.player1Stats.highestFinish || 0);
            bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
          }
          
          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player1Score!;
        }
        
        if (match.player2.id === player.id) {
          matchesPlayed++;
          if (match.player2Score! > match.player1Score!) matchesWon++;
          
          if (match.player2Stats) {
            total180s += match.player2Stats.count180s || 0;
            total171s += match.player2Stats.count171s || 0;
            highestFinish = Math.max(highestFinish, match.player2Stats.highestFinish || 0);
            bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
          }
          
          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player2Score!;
        }
      });
    });

    // Calculate from knockout matches
    tournament.knockoutMatches.forEach(match => {
      if (!match.completed) return;

      if (match.player1.id === player.id) {
        matchesPlayed++;
        if (match.player1Score! > match.player2Score!) matchesWon++;
        
        if (match.player1Stats) {
          total180s += match.player1Stats.count180s || 0;
          total171s += match.player1Stats.count171s || 0;
          highestFinish = Math.max(highestFinish, match.player1Stats.highestFinish || 0);
          bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
        }
        
        legsPlayed += match.player1Score! + match.player2Score!;
        legsWon += match.player1Score!;
      }
      
      if (match.player2.id === player.id) {
        matchesPlayed++;
        if (match.player2Score! > match.player1Score!) matchesWon++;
        
        if (match.player2Stats) {
          total180s += match.player2Stats.count180s || 0;
          total171s += match.player2Stats.count171s || 0;
          highestFinish = Math.max(highestFinish, match.player2Stats.highestFinish || 0);
          bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
        }
        
        legsPlayed += match.player1Score! + match.player2Score!;
        legsWon += match.player2Score!;
      }
    });

    return {
      total180s,
      total171s,
      highestFinish,
      bestLeg,
      legsPlayed,
      legsWon,
      matchesPlayed,
      matchesWon,
      legDifference: legsWon - (legsPlayed - legsWon)
    };
  }

  private async updatePlayerRankings(tournament: Tournament): Promise<void> {
    const currentRankings = this.playerRankings.value;
    const previousRanks = new Map(currentRankings.map(r => [r.player.id, r.currentRank]));
    const newRankings: PlayerRanking[] = [];

    tournament.participants.forEach(player => {
      const oldRanking = currentRankings.find(r => r.player.id === player.id);
      const tournamentPoints = this.calculateTournamentPoints(player, tournament);
      const totalPoints = (oldRanking?.totalPoints || 0) + tournamentPoints;
      const stats = this.calculatePlayerStatistics(player, tournament);
      
      const oldTournamentPoints = oldRanking?.tournamentPoints || [];
      
      newRankings.push({
        player: {
          id: player.id,
          name: player.name,
          totalPoints
        },
        totalPoints,
        rankChange: 0, // Temporary value, will be updated after sorting
        currentRank: 0, // Temporary value, will be updated after sorting
        tournamentPoints: [...oldTournamentPoints, tournamentPoints],
        total180s: (oldRanking?.total180s || 0) + stats.total180s,
        total171s: (oldRanking?.total171s || 0) + stats.total171s,
        highestFinish: Math.max(oldRanking?.highestFinish || 0, stats.highestFinish),
        bestLeg: Math.max(oldRanking?.bestLeg || 0, stats.bestLeg),
        legDifference: (oldRanking?.legDifference || 0) + stats.legDifference,
        matchesPlayed: (oldRanking?.matchesPlayed || 0) + stats.matchesPlayed,
        legsPlayed: (oldRanking?.legsPlayed || 0) + stats.legsPlayed,
        legsWon: (oldRanking?.legsWon || 0) + stats.legsWon,
        matchesWon: (oldRanking?.matchesWon || 0) + stats.matchesWon,
        wonLegsPercentage: 0, // Will be calculated after sorting
        wonMatchesPercentage: 0 // Will be calculated after sorting
      });
    });

    // Add players who didn't participate in this tournament
    currentRankings.forEach(ranking => {
      if (!newRankings.some(r => r.player.id === ranking.player.id)) {
        newRankings.push({
          ...ranking,
          rankChange: 0,
          currentRank: 0
        });
      }
    });

    // Sort by total points and calculate rank changes and percentages
    newRankings.sort((a, b) => b.totalPoints - a.totalPoints);
    newRankings.forEach((ranking, index) => {
      const currentRank = index + 1;
      const previousRank = previousRanks.get(ranking.player.id) || currentRank;
      ranking.currentRank = currentRank;
      ranking.rankChange = previousRank - currentRank;
      
      // Calculate percentages
      ranking.wonLegsPercentage = ranking.legsPlayed > 0 
        ? (ranking.legsWon / ranking.legsPlayed) * 100 
        : 0;
      
      ranking.wonMatchesPercentage = ranking.matchesPlayed > 0 
        ? (ranking.matchesWon / ranking.matchesPlayed) * 100 
        : 0;
    });

    try {
      await this.supabaseService.updatePlayerRankings(newRankings);
      this.playerRankings.next(newRankings);
    } catch (error) {
      console.error('Error updating player rankings:', error);
      throw error;
    }
  }

  private calculateTournamentPoints(player: Player, tournament: Tournament): number {
    let points = 0;
    
    // Find the player's final position
    if (tournament.completed && tournament.knockoutStageStarted) {
      // Check if player won the tournament (1st place)
      const finalMatch = tournament.knockoutMatches.find(m => m.round === 'Final' && m.completed);
      if (finalMatch) {
        if ((finalMatch.player1.id === player.id && finalMatch.player1Score! > finalMatch.player2Score!) ||
            (finalMatch.player2.id === player.id && finalMatch.player2Score! > finalMatch.player1Score!)) {
          return 40; // Winner gets 40 points
        }
        
        if (finalMatch.player1.id === player.id || finalMatch.player2.id === player.id) {
          return 32; // Runner-up gets 32 points
        }
      }

      // Check for semi-finalists (3rd-4th place)
      const semiFinalists = tournament.knockoutMatches
        .filter(m => m.round === 'Semi-Finals' && m.completed)
        .flatMap(m => [m.player1.id, m.player2.id]);
      
      if (semiFinalists.includes(player.id)) {
        return 24; // Semi-finalists get 24 points
      }

      // Check for quarter-finalists (5th-8th place)
      const quarterFinalists = tournament.knockoutMatches
        .filter(m => m.round === 'Quarter-Finals' && m.completed)
        .flatMap(m => [m.player1.id, m.player2.id]);
      
      if (quarterFinalists.includes(player.id)) {
        return 20; // Quarter-finalists get 20 points
      }
    }

    // Group stage points
    tournament.groups.forEach(group => {
      const standings = this.getGroupStandings(group);
      const playerPosition = standings.findIndex(s => s.player.id === player.id);
      
      if (playerPosition === 2) {
        points = 14; // 3rd place in group stage
      } else if (playerPosition >= 3) {
        points = 8; // 4th-6th place in group stage
      }
    });

    return points;
  }

  getCurrentTournament(): Observable<Tournament | null> {
    return this.currentTournament.asObservable();
  }

  getTournamentHistory(): Observable<Tournament[]> {
    return this.tournamentHistory.asObservable();
  }

  getPlayerRankings(): Observable<PlayerRanking[]> {
    return this.playerRankings.asObservable();
  }

    abandonTournament(): void {
    this.currentTournament.next(null);
    this.saveTournamentToStorage(null);
  }

  async completeTournament(): Promise<void> {
    const tournament = this.currentTournament.value;
    if (!tournament) return;

    const updatedTournament = { ...tournament, completed: true };
    const history = this.tournamentHistory.value;
    
    try {
      await this.supabaseService.saveTournament({
        name: updatedTournament.name,
        date: updatedTournament.date,
        data: updatedTournament,
        completed: true
      });

      this.tournamentHistory.next([...history, updatedTournament]);
      await this.updatePlayerRankings(updatedTournament);
      this.currentTournament.next(null);
      this.saveTournamentToStorage(null);
    } catch (error) {
      console.error('Error completing tournament:', error);
      throw error;
    }
  }
}