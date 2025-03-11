import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TournamentService } from "../../services/tournament.service";
import {
  Tournament,
  Group,
  PlayerStanding,
  Match,
  Player,
  PlayerRanking,
  TournamentSeries,
} from "../../models/tournament.model";

@Component({
  selector: "app-tournament-view",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./tournament-view.component.html",
  styleUrl: "./tournament-view.component.scss",
})
export class TournamentViewComponent implements OnInit {
  tournament: Tournament | null = null;
  playerRankings: PlayerRanking[] = [];
  tournamentSeries: TournamentSeries[] = [];
  newTournamentName: string = "";
  newPlayerName: string = "";
  newSeriesName: string = "";
  selectedSeriesId: string = "";
  showNewSeriesInput: boolean = false;
  participants: Player[] = [];
  availablePlayers: Player[] = [];
  showMatchesList = true;
  editingMatch: Match | null = null;
  Math = Math;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit() {
    this.tournamentService
      .getCurrentTournament()
      .subscribe((tournament) => (this.tournament = tournament));
    this.tournamentService.getPlayerRankings().subscribe((rankings) => {
      this.playerRankings = rankings;
      this.availablePlayers = rankings.map((r) => ({
        id: r.player.id,
        name: r.player.name,
        totalPoints: r.totalPoints,
      }));
    });
    this.tournamentService
      .getTournamentSeries()
      .subscribe((series) => (this.tournamentSeries = series));
  }

  async createNewSeries() {
    if (this.newSeriesName.trim()) {
      try {
        await this.tournamentService.createTournamentSeries(
          this.newSeriesName.trim()
        );
        this.newSeriesName = "";
        this.showNewSeriesInput = false;
      } catch (error) {
        console.error("Error creating series:", error);
      }
    }
  }

  isPlayerSelected(player: Player): boolean {
    return this.participants.some((p) => p.id === player.id);
  }

  togglePlayer(player: Player) {
    if (this.isPlayerSelected(player)) {
      this.removePlayer(player);
    } else {
      this.participants.push(player);
    }
  }

  addNewPlayer() {
    if (this.newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now(),
        name: this.newPlayerName.trim(),
        totalPoints: 0,
      };
      this.participants.push(newPlayer);
      this.newPlayerName = "";
    }
  }

  removePlayer(player: Player) {
    this.participants = this.participants.filter((p) => p.id !== player.id);
  }

  createTournament() {
    if (this.newTournamentName && this.participants.length >= 4) {
      this.tournamentService.createTournament(
        this.newTournamentName,
        this.participants,
        this.selectedSeriesId || undefined
      );
      this.newTournamentName = "";
      this.participants = [];
      this.selectedSeriesId = "";
    }
  }

  getMatchResult(group: Group, player1: Player, player2: Player) {
    const match = group.matches.find(
      (m) =>
        (m.player1.id === player1.id && m.player2.id === player2.id) ||
        (m.player1.id === player2.id && m.player2.id === player1.id)
    );

    if (!match) return null;

    const isReversed = match.player1.id === player2.id;
    const score = match.completed
      ? `${isReversed ? match.player2Score : match.player1Score} : ${
          isReversed ? match.player1Score : match.player2Score
        }`
      : "";

    return {
      match,
      score,
    };
  }

  getPlayerPoints(group: Group, player: Player): number {
    return group.matches
      .filter(
        (m) =>
          m.completed &&
          (m.player1.id === player.id || m.player2.id === player.id)
      )
      .reduce((points, match) => {
        if (
          (match.player1.id === player.id &&
            match.player1Score! > match.player2Score!) ||
          (match.player2.id === player.id &&
            match.player2Score! > match.player1Score!)
        ) {
          return points + 2;
        }
        return points;
      }, 0);
  }

  getPlayerBalance(group: Group, player: Player): string {
    let scored = 0;
    let conceded = 0;

    group.matches
      .filter(
        (m) =>
          m.completed &&
          (m.player1.id === player.id || m.player2.id === player.id)
      )
      .forEach((match) => {
        if (match.player1.id === player.id) {
          scored += match.player1Score!;
          conceded += match.player2Score!;
        } else {
          scored += match.player2Score!;
          conceded += match.player1Score!;
        }
      });

    return `${scored} : ${conceded}`;
  }

  isValidScore(match: Match): boolean {
    return (
      match.player1Score !== undefined &&
      match.player2Score !== undefined &&
      match.player1Score !== match.player2Score
    );
  }

  startEditing(match: Match) {
    if (match.completed) {
      this.editingMatch = match;
    }
  }

  submitResult(match: Match) {
    if (match.player1Score !== undefined && match.player2Score !== undefined) {
      match.player1Stats = match.player1Stats || {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0,
      };
      match.player2Stats = match.player2Stats || {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0,
      };

      this.tournamentService.updateMatchResult(
        match,
        match.player1Score,
        match.player2Score
      );
      this.editingMatch = null;
    }
  }

  getKnockoutRounds(): string[] {
    return ["Quarter-Finals", "Semi-Finals", "Final"];
  }

  getMatchesByRound(round: string): Match[] {
    return (
      this.tournament?.knockoutMatches.filter((m) => m.round === round) || []
    );
  }

  canCompleteTournament(): boolean {
    return (
      this.tournament?.knockoutStageStarted === true &&
      this.tournament.knockoutMatches.every((m) => m.completed)
    );
  }

  completeTournament() {
    if (this.canCompleteTournament()) {
      this.tournamentService.completeTournament();
    }
  }

  getAllGroupMatchesSorted(): Match[] {
    if (!this.tournament) return [];

    const allMatches: Match[] = [];
    const groupPositions = new Map<number, Map<number, number>>();

    // Calculate positions for each player in their group

    this.tournament.groups.forEach((group) => {
      const standings = this.getGroupStandings(group);
      const positionMap = new Map<number, number>();
      standings.forEach((standing, index) => {
        positionMap.set(standing.player.id, index + 1);
      });
      groupPositions.set(group.id, positionMap);
    });

    // Get all matches and sort them by group positions
    const maxMatches = Math.max(
      ...this.tournament.groups.map((group) => group.matches.length)
    );

    for (let i = 0; i < maxMatches; i++) {
      this.tournament.groups.forEach((group) => {
        if (group.matches[i]) {
          allMatches.push(group.matches[i]);
        }
      });
    }

    return allMatches;
  }

  getPlayerGroupPosition(player: Player, groupId: number): string {
    const group = this.tournament?.groups.find((g) => g.id === groupId);
    if (!group) return "";

    const standings = this.getGroupStandings(group);
    const position = standings.findIndex((s) => s.player.id === player.id) + 1;
    return position ? `${position}${this.getOrdinalSuffix(position)}` : "";
  }

  private getOrdinalSuffix(n: number): string {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  abandonTournament() {
    this.tournamentService.abandonTournament();
  }

  private getGroupStandings(group: Group): PlayerStanding[] {
    return group.players
      .map((player) => {
        const matches = group.matches.filter(
          (m) =>
            m.completed &&
            (m.player1.id === player.id || m.player2.id === player.id)
        );

        const wins = matches.filter(
          (m) =>
            (m.player1.id === player.id && m.player1Score! > m.player2Score!) ||
            (m.player2.id === player.id && m.player2Score! > m.player1Score!)
        ).length;

        return {
          player,
          matches: matches.length,
          wins,
          losses: matches.length - wins,
          points: wins * 2,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.wins / b.matches - a.wins / a.matches;
      });
  }
}
