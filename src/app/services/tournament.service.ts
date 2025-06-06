import { Injectable } from "@angular/core";
import { BehaviorSubject, from, map, Observable } from "rxjs";
import {
  Tournament,
  Player,
  Group,
  Match,
  PlayerStanding,
  PlayerRanking,
  TournamentSeries,
} from "../models/tournament.model";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class TournamentService {
  private currentTournament = new BehaviorSubject<Tournament | null>(null);
  private tournamentHistory = new BehaviorSubject<Tournament[]>([]);
  private playerRankings = new BehaviorSubject<PlayerRanking[]>([]);
  private tournamentSeries = new BehaviorSubject<TournamentSeries[]>([]);
  private currentSeries = new BehaviorSubject<TournamentSeries | null>(null);
  private readonly CURRENT_TOURNAMENT_KEY = "currentTournament";

  constructor(private supabaseService: SupabaseService) {
    this.loadInitialData();
    this.loadSavedTournament();
  }

  private async loadInitialData() {
    try {
      const [tournaments, rankings, series] = await Promise.all([
        this.supabaseService.getTournaments(),
        this.supabaseService.getPlayerRankings(),
        this.supabaseService.getTournamentSeries(),
      ]);

      this.tournamentHistory.next(
        tournaments.map((t) => ({
          ...t.data,
          id: t.id,
          name: t.name,
          date: new Date(t.date),
          series_id: t.series_id,
          series_name: t.series_name,
        }))
      );

      this.tournamentSeries.next(series);

      const sortedRankings = rankings
        .sort((a, b) => b.total_points - a.total_points)
        .map((r, index) => ({
          player: {
            id: r.player_id,
            name: r.player_name,
            totalPoints: r.total_points,
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
          wonLegsPercentage: r.legs_played
            ? (r.legs_won / r.legs_played) * 100
            : 0,
          wonMatchesPercentage: r.matches_played
            ? (r.matches_won / r.matches_played) * 100
            : 0,
        }));

      this.playerRankings.next(sortedRankings);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }

  public loadSavedTournament() {
    const savedTournament = localStorage.getItem(this.CURRENT_TOURNAMENT_KEY);
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament);
      tournament.date = new Date(tournament.date);
      this.currentTournament.next(tournament);
    }
  }

  private async saveTournamentToStorage(tournament: Tournament | null) {
    if (tournament) {
      localStorage.setItem(
        this.CURRENT_TOURNAMENT_KEY,
        JSON.stringify(tournament)
      );
      // Save to Supabase
      await this.supabaseService.saveTournament({
        name: tournament.name,
        date: tournament.date,
        data: tournament,
        completed: tournament.completed,
        series_id: tournament.series_id,
      });
    } else {
      localStorage.removeItem(this.CURRENT_TOURNAMENT_KEY);
    }
  }

  getIncompleteTournaments(): Observable<Tournament[]> {
    this.loadInitialData();
    return this.tournamentHistory.pipe(
      map(tournaments => tournaments.filter(t => !t.completed))
    );
  }

  private progressToNextRound(matches: Match[], winner: Player, loser: Player, currentRound: string, currentMatchIndex: number): void {
    if (currentRound === 'Round-16') {
      // Calculate which quarter-final match this winner should go to
      const quarterFinalIndex = Math.floor(currentMatchIndex / 2);
      const quarterFinalMatch = matches.find(m =>
          m.round === 'Quarter-Finals' &&
          matches.filter(qm => qm.round === 'Quarter-Finals' && qm.id < m.id).length === quarterFinalIndex
      );

      if (!quarterFinalMatch) {
        // Create new quarter-final match if it doesn't exist
        matches.push({
          id: Date.now(),
          player1: winner,
          player2: { id: -1, name: 'TBD', totalPoints: 0 },
          completed: false,
          round: 'Quarter-Finals',
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
      } else {
        // Replace the corresponding player in the quarter-final match
        const isFirstMatch = currentMatchIndex % 2 === 0;
        if (isFirstMatch) {
          quarterFinalMatch.player1 = winner;
        } else {
          quarterFinalMatch.player2 = winner;
        }
        // Reset match completion and scores when players change
        quarterFinalMatch.completed = false;
        quarterFinalMatch.player1Score = undefined;
        quarterFinalMatch.player2Score = undefined;
      }
    } else if (currentRound === 'Quarter-Finals') {
      const semiFinalIndex = Math.floor(currentMatchIndex / 2);
      const semiFinalMatch = matches.find(m =>
          m.round === 'Semi-Finals' &&
          matches.filter(sm => sm.round === 'Semi-Finals' && sm.id < m.id).length === semiFinalIndex
      );

      if (!semiFinalMatch) {
        matches.push({
          id: Date.now(),
          player1: winner,
          player2: { id: -1, name: 'TBD', totalPoints: 0 },
          completed: false,
          round: 'Semi-Finals',
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
      } else {
        // Replace the corresponding player in the semi-final match
        const isFirstMatch = currentMatchIndex % 2 === 0;
        if (isFirstMatch) {
          semiFinalMatch.player1 = winner;
        } else {
          semiFinalMatch.player2 = winner;
        }
        // Reset match completion and scores when players change
        semiFinalMatch.completed = false;
        semiFinalMatch.player1Score = undefined;
        semiFinalMatch.player2Score = undefined;
      }
    } else if (currentRound === 'Semi-Finals') {
      const finalMatch = matches.find(m => m.round === 'Final');
      const thirdPlaceMatch = matches.find(m => m.round === 'Third-Place');

      if (!finalMatch) {
        matches.push({
          id: Date.now(),
          player1: winner,
          player2: { id: -1, name: 'TBD', totalPoints: 0 },
          completed: false,
          round: 'Final',
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
      } else {
        // Replace the corresponding player in the final match
        const isFirstSemiFinal = currentMatchIndex === matches.findIndex(m => m.round === 'Semi-Finals');
        if (isFirstSemiFinal) {
          finalMatch.player1 = winner;
        } else {
          finalMatch.player2 = winner;
        }
        // Reset match completion and scores when players change
        finalMatch.completed = false;
        finalMatch.player1Score = undefined;
        finalMatch.player2Score = undefined;
      }

      // Handle third place match
      if (!thirdPlaceMatch) {
        const otherSemiFinal = matches.find(m =>
            m.round === 'Semi-Finals' &&
            m.completed &&
            m !== matches[currentMatchIndex]
        );

        if (otherSemiFinal?.completed) {
          const otherLoser = otherSemiFinal.player1Score! > otherSemiFinal.player2Score!
              ? otherSemiFinal.player2
              : otherSemiFinal.player1;

          matches.push({
            id: Date.now(),
            player1: loser,
            player2: otherLoser,
            completed: false,
            round: 'Third-Place',
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
        }
      } else {
        // Update third place match players
        const isFirstSemiFinal = currentMatchIndex === matches.findIndex(m => m.round === 'Semi-Finals');
        if (isFirstSemiFinal) {
          thirdPlaceMatch.player1 = loser;
        } else {
          thirdPlaceMatch.player2 = loser;
        }
        // Reset match completion and scores when players change
        thirdPlaceMatch.completed = false;
        thirdPlaceMatch.player1Score = undefined;
        thirdPlaceMatch.player2Score = undefined;
      }
    }
}

  createTournament(
    name: string,
    participants: Player[],
    seriesId?: string
  ): void {
    const groups = this.createGroups(participants);
    const tournament: Tournament = {
      id: Date.now(),
      name,
      date: new Date(),
      participants,
      groups,
      knockoutMatches: [],
      completed: false,
      knockoutStageStarted: false,
      series_id: seriesId,
    };

    // Clear any existing tournament and series
    this.currentSeries.next(null);

    // Set the new tournament
    this.currentTournament.next(tournament);
    this.saveTournamentToStorage(tournament);
  }

  private createGroups(participants: Player[]): Group[] {
    const numParticipants = participants.length;
    let numGroups: number;

    if (numParticipants <= 8) numGroups = 2;
    else if (numParticipants <= 24) numGroups = 4;
    else numGroups = 8;

    const shuffledPlayers = [...participants].sort(() => Math.random() - 0.5);

    const playersPerGroup: number[] = Array(numGroups).fill(0);
    let remainingPlayers = numParticipants;
    let currentGroup = 0;

    for (let i = 0; i < numGroups; i++) {
      playersPerGroup[i] = 2;
      remainingPlayers -= 2;
    }

    while (remainingPlayers > 0) {
      playersPerGroup[currentGroup]++;
      remainingPlayers--;
      currentGroup = (currentGroup + 1) % numGroups;
    }

    const groups: Group[] = [];
    let playerIndex = 0;

    for (let i = 0; i < numGroups; i++) {
      const groupPlayers = shuffledPlayers.slice(
        playerIndex,
        playerIndex + playersPerGroup[i]
      );
      playerIndex += playersPerGroup[i];

      groups.push({
        id: i,
        players: groupPlayers,
        matches: this.createGroupMatches(groupPlayers, i),
      });
    }

    return groups;
  }

  public createGroupMatches(players: Player[], groupId: number): Match[] {
    const matches: Match[] = [];
    const matchOrder = [
      [0, 5],
      [4, 1],
      [3, 2],
      [4, 0],
      [5, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [0, 2],
      [5, 4],
      [2, 1],
      [3, 0],
      [1, 5],
      [4, 3],
      [0, 1],
    ];

    matchOrder.forEach(([p1Index, p2Index], matchIndex) => {
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
          bestLeg: 0,
        },
        player2Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0,
        },
      });
    });

    return matches;
  }

  updateMatchResult(
    match: Match,
    player1Score: number,
    player2Score: number
  ): void {
    const tournament = this.currentTournament.value;
    if (!tournament) return;

    const updatedTournament = { ...tournament };

    if (match.groupId !== undefined) {
      updatedTournament.groups = tournament.groups.map((group) => {
        if (group.id === match.groupId) {
          return {
            ...group,
            matches: group.matches.map((m) =>
              m.id === match.id
                ? { ...m, player1Score, player2Score, completed: true }
                : m
            ),
          };
        }
        return group;
      });
    } else {
      const updatedMatches = [...tournament.knockoutMatches];
      const matchIndex = updatedMatches.findIndex((m) => m.id === match.id);

      if (matchIndex !== -1) {
        updatedMatches[matchIndex] = {
          ...match,
          player1Score,
          player2Score,
          completed: true,
        };

        const currentRound = match.round;
        if (
          currentRound === "Round-16" ||
          currentRound === "Quarter-Finals" ||
          currentRound === "Semi-Finals"
        ) {
          const winner =
            player1Score > player2Score ? match.player1 : match.player2;
          const loser =
            player1Score > player2Score ? match.player2 : match.player1;
          this.progressToNextRound(
            updatedMatches,
            winner,
            loser,
            currentRound,
            matchIndex
          );
        }
      }

      updatedTournament.knockoutMatches = updatedMatches;
    }

    this.currentTournament.next(updatedTournament);
    this.saveTournamentToStorage(updatedTournament);
  }

  completeGroupStage(tournament: Tournament, qualifyingPlayers: number): void {
    if (!this.areGroupMatchesCompleted(tournament)) return;

    const qualifiedPlayers = this.getQualifiedPlayers(
      tournament,
      qualifyingPlayers
    );
    const knockoutMatches =
      qualifyingPlayers === 16
        ? this.createRoundOf16Matches(qualifiedPlayers)
        : this.createQuarterFinalMatches(qualifiedPlayers);

    const updatedTournament = {
      ...tournament,
      knockoutMatches,
      knockoutStageStarted: true,
    };

    this.currentTournament.next(updatedTournament);
    this.saveTournamentToStorage(updatedTournament);
  }

  private areGroupMatchesCompleted(tournament: Tournament): boolean {
    return tournament.groups.every((group) =>
      group.matches.every((match) => match.completed)
    );
  }

  private getQualifiedPlayers(
    tournament: Tournament,
    qualifyingPlayers: number
  ): Player[] {
    const qualifiedPlayers: Player[] = [];
    const numGroups = tournament.groups.length;
    const playersPerGroup = Math.floor(qualifyingPlayers / numGroups);
    const extraPlayers = qualifyingPlayers % numGroups;

    // Get top players from each group
    tournament.groups.forEach((group) => {
      const standings = this.getGroupStandings(group);
      qualifiedPlayers.push(
        ...standings.slice(0, playersPerGroup).map((s) => s.player)
      );
    });

    // If we need extra players, get the best third-placed players
    if (extraPlayers > 0) {
      const thirdPlacedPlayers = tournament.groups
        .map((group) => this.getGroupStandings(group)[2])
        .sort((a, b) => b.points - a.points)
        .map((standing) => standing.player);

      qualifiedPlayers.push(...thirdPlacedPlayers.slice(0, extraPlayers));
    }

    return qualifiedPlayers;
  }

  private createRoundOf16Matches(players: Player[]): Match[] {
    const matches: Match[] = [];

    // Create Round of 16 matches with seeded pairings
    const pairings: [number, number][] = [
      [0, 15],
      [7, 8],
      [3, 12],
      [4, 11],
      [1, 14],
      [6, 9],
      [2, 13],
      [5, 10],
    ];

    pairings.forEach(([seed1, seed2]) => {
      matches.push({
        id: Date.now() + matches.length,
        player1: players[seed1],
        player2: players[seed2],
        completed: false,
        round: "Round-16",
        showStats: false,
        player1Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0,
        },
        player2Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0,
        },
      });
    });

    return matches;
  }

  private createQuarterFinalMatches(players: Player[]): Match[] {
    const matches: Match[] = [];
    const pairings: [number, number][] = [
      [0, 7],
      [3, 4],
      [2, 5],
      [1, 6],
    ];

    pairings.forEach(([seed1, seed2]) => {
      matches.push({
        id: Date.now() + matches.length,
        player1: players[seed1],
        player2: players[seed2],
        completed: false,
        round: "Quarter-Finals",
        showStats: false,
        player1Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0,
        },
        player2Stats: {
          count180s: 0,
          count171s: 0,
          highestFinish: 0,
          bestLeg: 0,
        },
      });
    });

    return matches;
  }

  private getPlayerGroupPoints(player: Player): number {
    const tournament = this.currentTournament.value;
    if (!tournament) return 0;

    const group = tournament.groups.find((g) =>
      g.players.some((p) => p.id === player.id)
    );
    if (!group) return 0;

    const standing = this.getGroupStandings(group).find(
      (s) => s.player.id === player.id
    );
    return standing ? standing.points : 0;
  }

  getGroupStandings(group: Group): PlayerStanding[] {
    const standings = group.players.map((player) => {
      const matches = group.matches.filter(
        (m) =>
          m.completed &&
          (m.player1.id === player.id || m.player2.id === player.id)
      );

      let wins = 0;
      let legsWon = 0;
      let legsConceded = 0;

      matches.forEach((match) => {
        if (match.player1.id === player.id) {
          if (match.player1Score! > match.player2Score!) wins++;
          legsWon += match.player1Score!;
          legsConceded += match.player2Score!;
        } else {
          if (match.player2Score! > match.player1Score!) wins++;
          legsWon += match.player2Score!;
          legsConceded += match.player1Score!;
        }
      });

      return {
        player,
        matches: matches.length,
        wins,
        losses: matches.length - wins,
        points: wins * 2,
        legDifference: legsWon - legsConceded,
        headToHead: new Map() // Will be filled later
      };
    });

    // Calculate head-to-head results for players with equal points
    standings.forEach((standing) => {
      standings.forEach((opponent) => {
        if (standing.player.id !== opponent.player.id && standing.points === opponent.points) {
          const match = group.matches.find(
            (m) =>
              m.completed &&
              ((m.player1.id === standing.player.id && m.player2.id === opponent.player.id) ||
                (m.player2.id === standing.player.id && m.player1.id === opponent.player.id))
          );

          if (match) {
            const isPlayer1 = match.player1.id === standing.player.id;
            const won = isPlayer1
              ? match.player1Score! > match.player2Score!
              : match.player2Score! > match.player1Score!;
            standing.headToHead.set(opponent.player.id, won ? 1 : -1);
          }
        }
      });
    });

    // Sort standings based on points, leg difference, and head-to-head
    return standings.sort((a, b) => b.points - a.points).sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      if (a.legDifference !== b.legDifference) {
        return b.legDifference - a.legDifference;
      }

      // If points and leg difference are equal, check head-to-head
      if (b.headToHead.has(a.player.id)) {
        return b.headToHead.get(a.player.id)!;
      }

      return 0;
    });
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

  getTournamentSeries(): Observable<TournamentSeries[]> {
    return this.tournamentSeries.asObservable();
  }

  async createTournamentSeries(name: string): Promise<void> {
    try {
      const newSeries = await this.supabaseService.createTournamentSeries(name);
      this.tournamentSeries.next([...this.tournamentSeries.value, newSeries]);
    } catch (error) {
      console.error("Error creating tournament series:", error);
      throw error;
    }
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
        completed: true,
        series_id: updatedTournament.series_id,
      });

      this.tournamentHistory.next([...history, updatedTournament]);
      await this.updatePlayerRankings(updatedTournament);
      this.currentTournament.next(null);
      this.saveTournamentToStorage(null);
    } catch (error) {
      console.error("Error completing tournament:", error);
      throw error;
    }
  }

  getCurrentSeries(): Observable<TournamentSeries | null> {
    return this.currentSeries.asObservable();
  }

  setCurrentSeries(series: TournamentSeries | null): void {
    this.currentSeries.next(series);
  }

  getSeriesRankings(seriesId: string): Observable<PlayerRanking[]> {
    return this.tournamentHistory.pipe(
      map((tournaments) => {
        const seriesTournaments = tournaments
          .filter((t) => t.series_id === seriesId && t.completed)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        if (seriesTournaments.length < 2) {
          // If there's only one or no tournaments, return rankings without changes
          return this.calculateSeriesRankings(seriesTournaments).map(
            (ranking) => ({
              ...ranking,
              rankChange: 0,
            })
          );
        }

        // Get rankings for all tournaments except the latest
        const previousTournaments = seriesTournaments.slice(0, -1);
        const previousRankings =
          this.calculateSeriesRankings(previousTournaments);

        // Get rankings for all tournaments
        const currentRankings = this.calculateSeriesRankings(seriesTournaments);

        // Calculate rank changes
        return currentRankings.map((currentRank) => {
          const previousRank = previousRankings.findIndex(
            (r) => r.player.id === currentRank.player.id
          );
          const currentPosition = currentRankings.findIndex(
            (r) => r.player.id === currentRank.player.id
          );

          // If player wasn't in previous rankings, show no change
          if (previousRank === -1) {
            return {
              ...currentRank,
              rankChange: 0,
            };
          }

          // Calculate position change (positive means moving up, negative means moving down)
          const change = previousRank - currentPosition;

          return {
            ...currentRank,
            rankChange: change,
          };
        });
      })
    );
  }

  private calculateSeriesRankings(tournaments: Tournament[]): PlayerRanking[] {
    const playerStats = new Map<number, PlayerRanking>();
    const tournamentCount = tournaments.length;
  
    // First, initialize all players with empty arrays of correct length
    tournaments.forEach(tournament => {
      tournament.participants.forEach(player => {
        if (!playerStats.has(player.id)) {
          playerStats.set(player.id, {
            player,
            totalPoints: 0,
            rankChange: 0,
            currentRank: 0,
            tournamentPoints: new Array(tournamentCount).fill(0), // Initialize with zeros
            total180s: 0,
            total171s: 0,
            highestFinish: 0,
            bestLeg: 0,
            legDifference: 0,
            matchesPlayed: 0,
            legsPlayed: 0,
            legsWon: 0,
            matchesWon: 0,
            wonLegsPercentage: 0,
            wonMatchesPercentage: 0
          });
        }
      });
    });
  
    // Then calculate points for each tournament
    tournaments.forEach((tournament, tournamentIndex) => {
      tournament.participants.forEach(player => {
        const stats = this.calculatePlayerStatistics(player, tournament);
        const points = this.calculateTournamentPoints(player, tournament);
        const currentStats = playerStats.get(player.id)!;
  
        // Update tournament points at the correct index
        currentStats.tournamentPoints[tournamentIndex] = points;
        currentStats.totalPoints += points;
        currentStats.total180s += stats.total180s;
        currentStats.total171s += stats.total171s;
        currentStats.highestFinish = Math.max(currentStats.highestFinish, stats.highestFinish);
        currentStats.bestLeg = Math.max(currentStats.bestLeg, stats.bestLeg);
        currentStats.legDifference += stats.legDifference;
        currentStats.matchesPlayed += stats.matchesPlayed;
        currentStats.legsPlayed += stats.legsPlayed;
        currentStats.legsWon += stats.legsWon;
        currentStats.matchesWon += stats.matchesWon;
      });
    });
  
    // Calculate percentages and sort by total points
    return Array.from(playerStats.values())
      .map(stats => ({
        ...stats,
        wonLegsPercentage: stats.legsPlayed > 0 ? (stats.legsWon / stats.legsPlayed) * 100 : 0,
        wonMatchesPercentage: stats.matchesPlayed > 0 ? (stats.matchesWon / stats.matchesPlayed) * 100 : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }
  
  setCurrentTournament(tournament: Tournament | null): void {
    this.currentTournament.next(tournament);
    this.saveTournamentToStorage(tournament);
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
    tournament.groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (!match.completed) return;

        if (match.player1.id === player.id) {
          matchesPlayed++;
          if (match.player1Score! > match.player2Score!) matchesWon++;

          if (match.player1Stats) {
            total180s += match.player1Stats.count180s || 0;
            total171s += match.player1Stats.count171s || 0;
            highestFinish = Math.max(
              highestFinish,
              match.player1Stats.highestFinish || 0
            );
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
            highestFinish = Math.max(
              highestFinish,
              match.player2Stats.highestFinish || 0
            );
            bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
          }

          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player2Score!;
        }
      });
    });

    // Calculate from knockout matches
    tournament.knockoutMatches.forEach((match) => {
      if (!match.completed) return;

      if (match.player1.id === player.id) {
        matchesPlayed++;
        if (match.player1Score! > match.player2Score!) matchesWon++;

        if (match.player1Stats) {
          total180s += match.player1Stats.count180s || 0;
          total171s += match.player1Stats.count171s || 0;
          highestFinish = Math.max(
            highestFinish,
            match.player1Stats.highestFinish || 0
          );
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
          highestFinish = Math.max(
            highestFinish,
            match.player2Stats.highestFinish || 0
          );
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
      legDifference: legsWon - (legsPlayed - legsWon),
    };
  }

  private calculateTournamentPoints(
    player: Player,
    tournament: Tournament
  ): number {
    let points = 0;
    
    if (tournament.completed && tournament.knockoutStageStarted) {
      const finalMatch = tournament.knockoutMatches.find(
        (m) => m.round === "Final" && m.completed
      );
      if (finalMatch) {
        if (
          (finalMatch.player1.id === player.id &&
            finalMatch.player1Score! > finalMatch.player2Score!) ||
          (finalMatch.player2.id === player.id &&
            finalMatch.player2Score! > finalMatch.player1Score!)
        ) {
          return 40;
        }

        if (
          finalMatch.player1.id === player.id ||
          finalMatch.player2.id === player.id
        ) {
          return 32;
        }
      }

      if (tournament.completed && tournament.knockoutStageStarted) {
        const thirdPlaceMatch = tournament.knockoutMatches.find(
          (m) => m.round === "Third-Place" && m.completed
        );
        if (thirdPlaceMatch) {
          if (
            (thirdPlaceMatch.player1.id === player.id &&
              thirdPlaceMatch.player1Score! > thirdPlaceMatch.player2Score!) ||
            (thirdPlaceMatch.player2.id === player.id &&
              thirdPlaceMatch.player2Score! > thirdPlaceMatch.player1Score!)
          ) {
            return 30;
          }

          if (
            thirdPlaceMatch.player1.id === player.id ||
            thirdPlaceMatch.player2.id === player.id
          ) {
            return 28;
          }
        }
      }

      // const semiFinalists = tournament.knockoutMatches
      //   .filter((m) => m.round === "Semi-Finals" && m.completed)
      //   .flatMap((m) => [m.player1.id, m.player2.id]);

      // if (semiFinalists.includes(player.id)) {
      //   return 24;
      // }

      const quarterFinalists = tournament.knockoutMatches
        .filter((m) => m.round === "Quarter-Finals" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (quarterFinalists.includes(player.id)) {
        return 20;
      }

      const roundOf16Players = tournament.knockoutMatches
        .filter((m) => m.round === "Round-16" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (roundOf16Players.includes(player.id)) {
        return 16;
      }
    }

    tournament.groups.forEach((group) => {
      const standings = this.getGroupStandings(group);
      const playerPosition = standings.findIndex(
        (s) => s.player.id === player.id
      );

      if (playerPosition === 2) {
        points = 14;
      } else if (playerPosition >= 3) {
        points = 8;
      }
    });

    return points;
  }

  async createPlayer(name: string): Promise<Player> {
    try {
      const player = await this.supabaseService.createPlayer({ name });
      const currentRankings = this.playerRankings.value;
      
      const newRanking: PlayerRanking = {
        player,
        totalPoints: 0,
        rankChange: 0,
        currentRank: currentRankings.length + 1,
        tournamentPoints: [],
        total180s: 0,
        total171s: 0,
        highestFinish: 0,
        bestLeg: 0,
        legDifference: 0,
        matchesPlayed: 0,
        legsPlayed: 0,
        legsWon: 0,
        matchesWon: 0,
        wonLegsPercentage: 0,
        wonMatchesPercentage: 0
      };

      this.playerRankings.next([...currentRankings, newRanking]);
      return player;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  private async updatePlayerRankings(tournament: Tournament): Promise<void> {
    const currentRankings = this.playerRankings.value;
    const previousRanks = new Map(
      currentRankings.map((r) => [r.player.id, r.currentRank])
    );
    const newRankings: PlayerRanking[] = [];

    tournament.participants.forEach((player) => {
      const oldRanking = currentRankings.find((r) => r.player.id === player.id);
      const tournamentPoints = this.calculateTournamentPoints(
        player,
        tournament
      );
      const totalPoints = (oldRanking?.totalPoints || 0) + tournamentPoints;
      const stats = this.calculatePlayerStatistics(player, tournament);

      const oldTournamentPoints = oldRanking?.tournamentPoints || [];

      newRankings.push({
        player: {
          id: player.id,
          name: player.name,
          totalPoints,
        },
        totalPoints,
        rankChange: 0,
        currentRank: 0,
        tournamentPoints: [...oldTournamentPoints, tournamentPoints],
        total180s: (oldRanking?.total180s || 0) + stats.total180s,
        total171s: (oldRanking?.total171s || 0) + stats.total171s,
        highestFinish: Math.max(
          oldRanking?.highestFinish || 0,
          stats.highestFinish
        ),
        bestLeg: Math.max(oldRanking?.bestLeg || 0, stats.bestLeg),
        legDifference: (oldRanking?.legDifference || 0) + stats.legDifference,
        matchesPlayed: (oldRanking?.matchesPlayed || 0) + stats.matchesPlayed,
        legsPlayed: (oldRanking?.legsPlayed || 0) + stats.legsPlayed,
        legsWon: (oldRanking?.legsWon || 0) + stats.legsWon,
        matchesWon: (oldRanking?.matchesWon || 0) + stats.matchesWon,
        wonLegsPercentage: 0,
        wonMatchesPercentage: 0,
      });
    });

    currentRankings.forEach((ranking) => {
      if (!newRankings.some((r) => r.player.id === ranking.player.id)) {
        newRankings.push({
          ...ranking,
          rankChange: 0,
          currentRank: 0,
        });
      }
    });

    newRankings.sort((a, b) => b.totalPoints - a.totalPoints);
    newRankings.forEach((ranking, index) => {
      const currentRank = index + 1;
      const previousRank = previousRanks.get(ranking.player.id) || currentRank;
      ranking.currentRank = currentRank;
      ranking.rankChange = previousRank - currentRank;

      ranking.wonLegsPercentage =
        ranking.legsPlayed > 0
          ? (ranking.legsWon / ranking.legsPlayed) * 100
          : 0;

      ranking.wonMatchesPercentage =
        ranking.matchesPlayed > 0
          ? (ranking.matchesWon / ranking.matchesPlayed) * 100
          : 0;
    });

    try {
      await this.supabaseService.updatePlayerRankings(newRankings);
      this.playerRankings.next(newRankings);
    } catch (error) {
      console.error("Error updating player rankings:", error);
      throw error;
    }
  }
}
