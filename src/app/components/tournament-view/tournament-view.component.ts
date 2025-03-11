import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import {
  Tournament,
  Group,
  PlayerStanding,
  Match,
  Player,
  PlayerRanking,
  MatchStatistics
} from '../../models/tournament.model';

@Component({
  selector: 'app-tournament-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tournament-container">
      <!-- Tournament Creation -->
      <div *ngIf="!tournament" class="create-tournament">
        <h2>Create New Tournament</h2>
        <div class="form-group">
          <label>Tournament Name:</label>
          <input
            type="text"
            [(ngModel)]="newTournamentName"
            class="form-input"
          />
        </div>

        <!-- Player Selection -->
        <div class="player-selection">
          <h3>Add Players</h3>

          <!-- Existing Players -->
          <div class="existing-players">
            <h4>Select Existing Players</h4>
            <div class="players-grid">
              <div
                *ngFor="let player of availablePlayers"
                class="player-card"
                [class.selected]="isPlayerSelected(player)"
                (click)="togglePlayer(player)"
              >
                <span class="player-name">{{ player.name }}</span>
                <span class="player-points"
                  >Points: {{ player.totalPoints }}</span
                >
              </div>
            </div>
          </div>

          <!-- Add New Player -->
          <div class="add-new-player">
            <h4>Add New Player</h4>
            <div class="form-group">
              <input
                type="text"
                [(ngModel)]="newPlayerName"
                placeholder="Enter player name"
                class="form-input"
              />
              <button
                (click)="addNewPlayer()"
                class="btn"
                [disabled]="!newPlayerName.trim()"
              >
                Add Player
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Players List -->
        <div class="selected-players">
          <h3>Selected Players ({{ participants.length }})</h3>
          <div class="players-list">
            <div *ngFor="let player of participants" class="selected-player">
              <span>{{ player.name }}</span>
              <button (click)="removePlayer(player)" class="btn-small danger">
                Remove
              </button>
            </div>
          </div>
        </div>

        <button
          (click)="createTournament()"
          [disabled]="participants.length < 4 || !newTournamentName.trim()"
          class="btn primary create-btn"
        >
          Start Tournament ({{ participants.length }} players)
        </button>
      </div>

      <!-- Active Tournament View -->
      <div *ngIf="tournament">
        <h1>{{ tournament.name }}</h1>
          <button (click)="abandonTournament()" class="btn danger">
            Abandon Tournament
          </button>
        
        <!-- Toggle List View Button -->
        <div class="view-controls">
          <button class="btn" (click)="showMatchesList = !showMatchesList">
            {{ showMatchesList ? 'Hide' : 'Show' }} Matches List
          </button>
        </div>

        <!-- Group Stage -->
        <div *ngIf="!tournament.knockoutStageStarted" class="tournament-view">
        
          <!-- Matrix Tables -->
          <div class="groups-container">
            <div *ngFor="let group of tournament.groups" class="group">
              <h2>Group {{ group.id + 1 }}</h2>
              
              <!-- Matrix-style results table -->
              <div class="matrix-table-container">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th class="player-header">LP.</th>
                      <th class="player-header">Uczestnik</th>
                      <th *ngFor="let i of [1,2,3,4,5,6]">{{ i }}</th>
                      <th>Pkt.</th>
                      <th>Bilans</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let player1 of group.players; let i = index">
                      <td class="rank">{{ i + 1 }}</td>
                      <td class="player-name">{{ player1.name }}</td>
                      <td *ngFor="let player2 of group.players; let j = index" 
                          [class.match-cell]="player1.id !== player2.id"
                          [class.diagonal]="player1.id === player2.id">
                        <ng-container *ngIf="player1.id !== player2.id">
                          <ng-container *ngIf="getMatchResult(group, player1, player2) as result">
                            <div *ngIf="result.match" 
                                 class="match-result"
                                 [class.completed]="result.match.completed">
                              <ng-container *ngIf="!result.match.completed || editingMatch === result.match">
                                <div class="match-input">
                                  <input 
                                    type="number" 
                                    [(ngModel)]="result.match.player1Score" 
                                    class="score-input"
                                  >
                                  :
                                  <input 
                                    type="number" 
                                    [(ngModel)]="result.match.player2Score" 
                                    class="score-input"
                                  >
                                  <button 
                                    (click)="submitResult(result.match)" 
                                    class="btn-small"
                                    [disabled]="!isValidScore(result.match)"
                                  >
                                    ✓
                                  </button>
                                </div>
                              </ng-container>
                              <div *ngIf="result.match.completed && editingMatch !== result.match"
                                   (dblclick)="startEditing(result.match)">
                                {{ result.score }}
                              </div>
                            </div>
                          </ng-container>
                        </ng-container>
                      </td>
                      <td class="points">{{ getPlayerPoints(group, player1) }}</td>
                      <td class="balance">{{ getPlayerBalance(group, player1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Match Statistics -->
              <div class="matches">
                <div *ngFor="let match of group.matches" 
                     class="match"
                     [class.completed]="match.completed">
                  <div class="match-header">
                    <span>{{ match.player1.name }} vs {{ match.player2.name }}</span>
                    <div class="match-controls">
                      <div *ngIf="match.completed" 
                           class="match-score"
                           (dblclick)="startEditing(match)">
                        {{ match.player1Score }} : {{ match.player2Score }}
                      </div>
                      <button 
                        (click)="match.showStats = !match.showStats" 
                        class="btn-small"
                        [class.active]="match.showStats"
                      >
                        Stats
                      </button>
                    </div>
                  </div>
                  <div *ngIf="match.showStats" class="match-stats">
                    <div class="player-stats">
                      <h5>{{ match.player1.name }}</h5>
                      <div class="stat-inputs">
                        <div class="stat-input">
                          <label>180s:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player1Stats!.count180s"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>171s:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player1Stats!.count171s"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>HF:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player1Stats!.highestFinish"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>BL:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player1Stats!.bestLeg"
                            class="stat-number-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="player-stats">
                      <h5>{{ match.player2.name }}</h5>
                      <div class="stat-inputs">
                        <div class="stat-input">
                          <label>180s:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player2Stats!.count180s"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>171s:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player2Stats!.count171s"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>HF:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player2Stats!.highestFinish"
                            class="stat-number-input"
                          />
                        </div>
                        <div class="stat-input">
                          <label>BL:</label>
                          <input
                            type="number"
                            [(ngModel)]="match.player2Stats!.bestLeg"
                            class="stat-number-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Sequential Matches List -->
          <div *ngIf="showMatchesList" class="sequential-matches">
            <h2>All Matches</h2>
            <div class="matches-container">
              <div *ngFor="let match of getAllGroupMatchesSorted()" 
                   class="match-item"
                   [class.completed]="match.completed">
                <div class="match-header">
                  <span class="group-label">Group {{ match.groupId! + 1 }}</span>
                  <span class="player-position">
                    {{ getPlayerGroupPosition(match.player1, match.groupId!) }} vs
                    {{ getPlayerGroupPosition(match.player2, match.groupId!) }}
                  </span>
                </div>
                <div class="match-score">
                  <div class="player-name">{{ match.player1.name }}</div>
                  <div *ngIf="!match.completed || editingMatch === match" class="match-input">
                    <input 
                      type="number" 
                      [(ngModel)]="match.player1Score" 
                      class="score-input"
                      placeholder="0"
                    >
                    :
                    <input 
                      type="number" 
                      [(ngModel)]="match.player2Score" 
                      class="score-input"
                      placeholder="0"
                    >
                    <button 
                      (click)="submitResult(match)" 
                      class="btn-small"
                      [disabled]="!isValidScore(match)"
                    >
                      Zakoncz
                    </button>
                  </div>
                  <div *ngIf="match.completed && editingMatch !== match" 
                       class="match-result"
                       (dblclick)="startEditing(match)">
                    {{ match.player1Score }} : {{ match.player2Score }}
                  </div>
                  <div class="player-name">{{ match.player2.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Knockout Stage -->
        <div *ngIf="tournament.knockoutStageStarted" class="knockout-stage">
          <h2>Knockout Stage</h2>
          <div class="knockout-rounds">
            <div *ngFor="let round of getKnockoutRounds()" class="round">
              <h3>{{ round }}</h3>
              <div class="knockout-matches">
                <div
                  *ngFor="let match of getMatchesByRound(round)"
                  class="knockout-match"
                >
                  <div class="match-players">
                    {{ match.player1.name }} vs {{ match.player2.name }}
                  </div>
                  <div *ngIf="!match.completed" class="match-input">
                    <input
                      type="number"
                      [(ngModel)]="match.player1Score"
                      class="score-input"
                    />
                    -
                    <input
                      type="number"
                      [(ngModel)]="match.player2Score"
                      class="score-input"
                    />
                    <button
                      (click)="submitResult(match)"
                      class="btn-small"
                      [disabled]="!isValidScore(match)"
                    >
                      Submit
                    </button>
                  </div>
                  <div *ngIf="match.completed" class="match-result">
                    {{ match.player1Score }} - {{ match.player2Score }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tournament Controls -->
        <div class="tournament-controls">
          <button
            *ngIf="canCompleteTournament()"
            (click)="completeTournament()"
            class="btn primary"
          >
            Complete Tournament
          </button>
        </div>
      </div>

      <!-- Rankings Table -->
      <div class="rankings-container">
        <h2>Overall Rankings</h2>
        <table class="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Points</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ranking of playerRankings; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ ranking.player.name }}</td>
              <td>{{ ranking.totalPoints }}</td>
              <td>
                <span
                  [class.up]="ranking.rankChange > 0"
                  [class.down]="ranking.rankChange < 0"
                >
                  {{
                    ranking.rankChange > 0
                      ? "↑"
                      : ranking.rankChange < 0
                      ? "↓"
                      : "-"
                  }}
                  {{
                    ranking.rankChange !== 0 ? Math.abs(ranking.rankChange) : ""
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .tournament-container {
      padding: 20px;
    }

    .create-tournament {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-input {
      width: 100%;
      padding: 8px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .player-selection {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin: 15px 0;
    }

    .player-card {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .player-card:hover {
      border-color: #007bff;
      transform: translateY(-2px);
    }

    .player-card.selected {
      background: #e3f2fd;
      border-color: #007bff;
    }

    .player-name {
      font-weight: 500;
    }

    .player-points {
      font-size: 0.9em;
      color: #666;
    }

    .add-new-player {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }

    .selected-players {
      margin: 20px 0;
    }

    .selected-player {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 5px;
    }

    .create-btn {
      width: 100%;
      margin-top: 20px;
      padding: 12px;
    }

    .tournament-view {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 20px;
      margin-top: 20px;
    }

    .sequential-matches {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      width: 400px;
    }

    .groups-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
      gap: 20px;
    }

    .group {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 8px;
      background: white;
    }

    .matrix-table-container {
      overflow-x: auto;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
    }

    .matrix-table th,
    .matrix-table td {
      padding: 8px;
      text-align: center;
      border: 1px solid #ddd;
    }

    .matrix-table th {
      background: #f8f9fa;
      font-weight: 600;
    }

    .player-header {
      text-align: left;
      padding-left: 16px;
    }

    .rank {
      text-align: center;
      font-weight: 500;
      width: 50px;
    }

    .player-name {
      text-align: left;
      font-weight: 500;
      padding-left: 16px;
    }

    .match-score {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .match-cell {
      background: #fff;
      min-width: 100px;
    }

    .diagonal {
      background: #f8f9fa;
    }

    .match-result {
      min-width: 80px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .match-result:hover {
      background-color: #e9ecef;
    }

    .match-input {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }

    .score-input {
      width: 30px;
      padding: 2px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 3px;
    }

    .points,
    .balance {
      font-weight: 600;
      background: #f8f9fa;
    }

    .matches {
      margin-top: 20px;
    }

    .match {
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 6px;
      margin-bottom: 10px;
      background: #f8f9fa;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .match-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .match-score {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      background: #f8f9fa;
    }

    .match-score:hover {
      background: #e9ecef;
    }

    .match-stats {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }

    .player-stats {
      margin-bottom: 15px;
    }

    .player-stats h5 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .stat-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .stat-input {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .stat-input label {
      font-size: 0.8em;
      color: #666;
      min-width: 40px;
    }

    .stat-number-input {
      width: 50px;
      padding: 2px 4px;
      border: 1px solid #ddd;
      border-radius: 3px;
    }

    .knockout-stage {
      margin-top: 30px;
    }

    .knockout-rounds {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .round {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .knockout-matches {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .knockout-match {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      border: 1px solid #eee;
    }

    .tournament-controls {
      margin-top: 30px;
      text-align: center;
    }

    .rankings-container {
      margin-top: 40px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

    .up {
      color: green;
    }

    .down {
      color: red;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
    }

    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-small {
      padding: 4px 8px;
      font-size: 0.9em;
    }

    .btn.primary {
      background: #28a745;
    }

    .btn.danger {
      background: #dc3545;
    }

    .btn-small.danger {
      background: #dc3545;
    }

    .btn-small.active {
      background: #28a745;
    }

    .view-controls {
      display: flex;
      justify-content: flex-end;
      margin: 10px 0;
    }

    .btn.active {
      background: #28a745;
    }

      .matches-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .match-item {
        border: 1px solid #eee;
        border-radius: 6px;
        overflow: hidden;
      }

      .match-header {
        background: #f8f9fa;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
      }

    .match-item.completed,
    .match.completed,
    .match-result.completed {
      border: 2px solid #28a745;
    }
  `]
})
export class TournamentViewComponent implements OnInit {
  tournament: Tournament | null = null;
  playerRankings: PlayerRanking[] = [];
  newTournamentName: string = "";
  newPlayerName: string = "";
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
        this.participants
      );
      this.newTournamentName = "";
      this.participants = [];
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
        bestLeg: 0
      };
      match.player2Stats = match.player2Stats || {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0
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
