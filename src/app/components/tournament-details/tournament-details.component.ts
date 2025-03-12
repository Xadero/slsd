import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TournamentService } from "../../services/tournament.service";
import {
  Tournament,
  PlayerRanking,
  Player,
} from "../../models/tournament.model";

@Component({
  selector: "app-tournament-details",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tournament-details-container" *ngIf="tournament">
      <div class="tournament-header">
        <h1>{{ tournament.name }}</h1>
        <div class="tournament-meta">
          <span class="date">{{ tournament.date | date : "mediumDate" }}</span>
          <span class="series" *ngIf="tournament.series_name"
            >Series: {{ tournament.series_name }}</span
          >
        </div>
      </div>

      <!-- Tournament Rankings -->
      <div class="rankings-container">
        <h2>Tournament Rankings</h2>
        <div class="table-container">
          <table class="rankings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Points</th>
                <th>180s</th>
                <th>171s</th>
                <th>HF</th>
                <th>BL</th>
                <th>Leg +/-</th>
                <th>Won Legs %</th>
                <th>Won Matches %</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let player of getTournamentRankings(); let i = index">
                <td>{{ i + 1 }}</td>
                <td>{{ player.name }}</td>
                <td>{{ getTournamentPoints(player) }}</td>
                <td>{{ getPlayerStats(player).total180s }}</td>
                <td>{{ getPlayerStats(player).total171s }}</td>
                <td>{{ getPlayerStats(player).highestFinish }}</td>
                <td>{{ getPlayerStats(player).bestLeg }}</td>
                <td>{{ getPlayerStats(player).legDifference }}</td>
                <td>
                  {{
                    getPlayerStats(player).wonLegsPercentage | number : "1.1-1"
                  }}%
                </td>
                <td>
                  {{
                    getPlayerStats(player).wonMatchesPercentage
                      | number : "1.1-1"
                  }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tournament Statistics -->
      <div class="tournament-stats-container">
        <h2>Tournament Statistics</h2>

        <!-- Group Stage Results -->
        <div class="section">
          <h3>Group Stage Results</h3>
          <div class="groups-grid">
            <div *ngFor="let group of tournament.groups" class="group-results">
              <h4>Group {{ group.id + 1 }}</h4>
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Matches</th>
                    <th>Won</th>
                    <th>Lost</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let standing of getGroupStandings(group)">
                    <td>{{ standing.player.name }}</td>
                    <td>{{ standing.matches }}</td>
                    <td>{{ standing.wins }}</td>
                    <td>{{ standing.losses }}</td>
                    <td>{{ standing.points }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Knockout Stage Results -->
        <div *ngIf="tournament.knockoutStageStarted" class="section">
          <h3>Knockout Stage Results</h3>
          <div class="knockout-results">
            <div
              *ngFor="let round of ['Quarter-Finals', 'Semi-Finals', 'Final']"
              class="round-results"
            >
              <h4>{{ round }}</h4>
              <div class="matches">
                <div
                  *ngFor="let match of getMatchesByRound(round)"
                  class="match"
                >
                  <div class="match-players">
                    <span [class.winner]="isWinner(match, match.player1)">{{
                      match.player1.name
                    }}</span>
                    <span class="score"
                      >{{ match.player1Score }} - {{ match.player2Score }}</span
                    >
                    <span [class.winner]="isWinner(match, match.player2)">{{
                      match.player2.name
                    }}</span>
                  </div>
                  <div
                    *ngIf="match.player1Stats || match.player2Stats"
                    class="match-stats"
                  >
                    <div class="player-stats" *ngIf="match.player1Stats">
                      <div>180s: {{ match.player1Stats.count180s }}</div>
                      <div>171s: {{ match.player1Stats.count171s }}</div>
                      <div>HF: {{ match.player1Stats.highestFinish }}</div>
                      <div>BL: {{ match.player1Stats.bestLeg }}</div>
                    </div>
                    <div class="player-stats" *ngIf="match.player2Stats">
                      <div>180s: {{ match.player2Stats.count180s }}</div>
                      <div>171s: {{ match.player2Stats.count171s }}</div>
                      <div>HF: {{ match.player2Stats.highestFinish }}</div>
                      <div>BL: {{ match.player2Stats.bestLeg }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Player Statistics -->
        <div class="section">
          <h3>Player Statistics</h3>
          <div class="player-stats-grid">
            <div
              *ngFor="let player of tournament.participants"
              class="player-stat-card"
            >
              <h4>{{ player.name }}</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span>180s:</span>
                  <span>{{ getPlayerStats(player).total180s }}</span>
                </div>
                <div class="stat-item">
                  <span>171s:</span>
                  <span>{{ getPlayerStats(player).total171s }}</span>
                </div>
                <div class="stat-item">
                  <span>Highest Finish:</span>
                  <span>{{ getPlayerStats(player).highestFinish }}</span>
                </div>
                <div class="stat-item">
                  <span>Best Leg:</span>
                  <span>{{ getPlayerStats(player).bestLeg }}</span>
                </div>
                <div class="stat-item">
                  <span>Average Finish:</span>
                  <span>{{
                    getPlayerStats(player).averageFinish | number : "1.1-1"
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tournament-details-container {
        padding: 20px;
      }

      .tournament-header {
        margin-bottom: 30px;
        text-align: center;
      }

      .tournament-meta {
        color: #666;
        font-size: 0.9em;
        display: flex;
        gap: 20px;
        justify-content: center;
      }

      .rankings-container {
        margin: 20px 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 20px;
      }

      .table-container {
        overflow-x: auto;
      }

      .rankings-table {
        width: 100%;
        border-collapse: collapse;
      }

      .rankings-table th,
      .rankings-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }

      .rankings-table th {
        background: #f8f9fa;
        font-weight: 600;
      }

      .section {
        margin: 30px 0;
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .groups-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .group-results {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }

      .results-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      .results-table th,
      .results-table td {
        padding: 8px;
        text-align: center;
        border-bottom: 1px solid #eee;
      }

      .knockout-results {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .round-results {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }

      .match {
        background: white;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .match-players {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .winner {
        font-weight: bold;
        color: #28a745;
      }

      .score {
        font-weight: 500;
      }

      .match-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        font-size: 0.9em;
        color: #666;
      }

      .player-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }

      .player-stat-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }

      .stats-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        color: #666;
      }
    `,
  ],
})
export class TournamentDetailsComponent implements OnInit {
  tournament: Tournament | null = null;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit() {
    this.tournamentService.getCurrentTournament().subscribe((tournament) => {
      this.tournament = tournament;
    });
  }

  getTournamentRankings(): Player[] {
    if (!this.tournament) return [];

    return [...this.tournament.participants].sort((a, b) => {
      const pointsA = this.getTournamentPoints(a);
      const pointsB = this.getTournamentPoints(b);
      return pointsB - pointsA;
    });
  }

  getTournamentPoints(player: Player): number {
    if (!this.tournament) return 0;

    let points = 0;

    if (this.tournament.completed && this.tournament.knockoutStageStarted) {
      const finalMatch = this.tournament.knockoutMatches.find(
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

      const semiFinalists = this.tournament.knockoutMatches
        .filter((m) => m.round === "Semi-Finals" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (semiFinalists.includes(player.id)) {
        return 24;
      }

      const quarterFinalists = this.tournament.knockoutMatches
        .filter((m) => m.round === "Quarter-Finals" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (quarterFinalists.includes(player.id)) {
        return 20;
      }

      const roundOf16Players = this.tournament.knockoutMatches
        .filter((m) => m.round === "Round-16" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (roundOf16Players.includes(player.id)) {
        return 16;
      }
    }

    this.tournament.groups.forEach((group) => {
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

  getGroupStandings(group: any) {
    return this.tournamentService.getGroupStandings(group);
  }

  getMatchesByRound(round: string): any[] {
    return (
      this.tournament?.knockoutMatches.filter((m) => m.round === round) || []
    );
  }

  isWinner(match: any, player: any): boolean {
    if (!match.completed) return false;
    if (match.player1.id === player.id) {
      return match.player1Score > match.player2Score;
    }
    return match.player2Score > match.player1Score;
  }

  getPlayerStats(player: Player) {
    if (!this.tournament)
      return {
        total180s: 0,
        total171s: 0,
        highestFinish: 0,
        bestLeg: 0,
        averageFinish: 0,
        legDifference: 0,
        matchesPlayed: 0,
        legsPlayed: 0,
        legsWon: 0,
        matchesWon: 0,
        wonLegsPercentage: 0,
        wonMatchesPercentage: 0,
      };

    let total180s = 0;
    let total171s = 0;
    let highestFinish = 0;
    let bestLeg = 0;
    let totalFinishes = 0;
    let finishCount = 0;
    let legsPlayed = 0;
    let legsWon = 0;
    let matchesPlayed = 0;
    let matchesWon = 0;

    // Calculate from group matches
    this.tournament.groups.forEach((group) => {
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
            if (match.player1Stats.highestFinish) {
              totalFinishes += match.player1Stats.highestFinish;
              finishCount++;
            }
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
            if (match.player2Stats.highestFinish) {
              totalFinishes += match.player2Stats.highestFinish;
              finishCount++;
            }
          }

          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player2Score!;
        }
      });
    });

    // Calculate from knockout matches
    this.tournament.knockoutMatches.forEach((match) => {
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
          if (match.player1Stats.highestFinish) {
            totalFinishes += match.player1Stats.highestFinish;
            finishCount++;
          }
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
          if (match.player2Stats.highestFinish) {
            totalFinishes += match.player2Stats.highestFinish;
            finishCount++;
          }
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
      averageFinish: finishCount > 0 ? totalFinishes / finishCount : 0,
      legDifference: legsWon - (legsPlayed - legsWon),
      matchesPlayed,
      legsPlayed,
      legsWon,
      matchesWon,
      wonLegsPercentage: legsPlayed > 0 ? (legsWon / legsPlayed) * 100 : 0,
      wonMatchesPercentage:
        matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0,
    };
  }
}
