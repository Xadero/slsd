import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {Tournament, Match, PlayerTournamentStats, Player} from '../../models/tournament.model';

@Component({
  selector: 'app-tournament-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ tournament.name }}</h2>
        <button class="close-button" (click)="close()">×</button>
      </div>

      <!-- Group Stage Results -->
      <div class="section">
        <h3>Group Stage Results</h3>
        <div class="groups-grid">
          <div *ngFor="let group of tournament.groups" class="group-results">
            <h4>Group {{ group.id + 1 }}</h4>
            <table class="results-table">
              <thead>
                <tr>
                  <th>Player 1</th>
                  <th>Score</th>
                  <th>Player 2</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let match of group.matches">
                  <td [class.winner]="isWinner(match, match.player1)">
                    {{ match.player1.name }}
                    <div *ngIf="match.player1Stats" class="player-match-stats">
                      <span *ngIf="match.player1Stats.count180s">180s: {{match.player1Stats.count180s}}</span>
                      <span *ngIf="match.player1Stats.count171s">171s: {{match.player1Stats.count171s}}</span>
                      <span *ngIf="match.player1Stats.highestFinish">HF: {{match.player1Stats.highestFinish}}</span>
                      <span *ngIf="match.player1Stats.bestLeg">BL: {{match.player1Stats.bestLeg}}</span>
                    </div>
                  </td>
                  <td class="score">
                    {{ match.completed ? match.player1Score + ' - ' + match.player2Score : '-' }}
                  </td>
                  <td [class.winner]="isWinner(match, match.player2)">
                    {{ match.player2.name }}
                    <div *ngIf="match.player2Stats" class="player-match-stats">
                      <span *ngIf="match.player2Stats.count180s">180s: {{match.player2Stats.count180s}}</span>
                      <span *ngIf="match.player2Stats.count171s">171s: {{match.player2Stats.count171s}}</span>
                      <span *ngIf="match.player2Stats.highestFinish">HF: {{match.player2Stats.highestFinish}}</span>
                      <span *ngIf="match.player2Stats.bestLeg">BL: {{match.player2Stats.bestLeg}}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="standings">
              <h5>Final Standings</h5>
              <table class="standings-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Player</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let standing of getGroupStandings(group); let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ standing.player.name }}</td>
                    <td>{{ standing.points }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Knockout Stage Results -->
      <div *ngIf="tournament.knockoutStageStarted" class="section">
        <h3>Knockout Stage Results</h3>
        <div class="knockout-results">
          <div *ngFor="let round of ['Quarter-Finals', 'Semi-Finals', 'Final']" class="round-results">
            <h4>{{ round }}</h4>
            <table class="results-table">
              <tbody>
                <tr *ngFor="let match of getMatchesByRound(round)">
                  <td [class.winner]="isWinner(match, match.player1)">
                    {{ match.player1.name }}
                  </td>
                  <td class="score">
                    {{ match.completed ? match.player1Score + ' - ' + match.player2Score : '-' }}
                  </td>
                  <td [class.winner]="isWinner(match, match.player2)">
                    {{ match.player2.name }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tournament Statistics -->
      <div class="section">
        <h3>Tournament Statistics</h3>
        <div class="statistics">
          <div class="stat-item">
            <span class="stat-label">Total Matches:</span>
            <span class="stat-value">{{ getTotalMatches() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Points:</span>
            <span class="stat-value">{{ getTotalPointsScored() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg Score/Match:</span>
            <span class="stat-value">{{ getAverageScorePerMatch() | number:'1.1-1' }}</span>
          </div>
        </div>

        <h4>Player Statistics</h4>
        <div class="player-tournament-stats">
          <div *ngFor="let player of tournament.participants" class="player-stat-card">
            <h5>{{ player.name }}</h5>
            <div class="player-stat-details">
              <div class="stat-row">
                <span>180s:</span>
                <span>{{ getPlayerTournamentStats(player).total180s }}</span>
              </div>
              <div class="stat-row">
                <span>171s:</span>
                <span>{{ getPlayerTournamentStats(player).total171s }}</span>
              </div>
              <div class="stat-row">
                <span>Highest Finish:</span>
                <span>{{ getPlayerTournamentStats(player).highestFinish }}</span>
              </div>
              <div class="stat-row">
                <span>Best Leg:</span>
                <span>{{ getPlayerTournamentStats(player).bestLeg }}</span>
              </div>
              <div class="stat-row">
                <span>Avg Finish:</span>
                <span>{{ getPlayerTournamentStats(player).averageFinish | number:'1.1-1' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .dialog-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }

    .close-button:hover {
      color: #333;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .group-results {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    .results-table th,
    .results-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .results-table .score {
      text-align: center;
      font-weight: 500;
    }

    .winner {
      font-weight: bold;
      color: #28a745;
    }

    .standings {
      margin-top: 15px;
    }

    .standings h5 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .standings-table th,
    .standings-table td {
      padding: 6px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .knockout-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .round-results {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }

    .statistics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 1.2em;
      font-weight: 500;
      color: #2c3e50;
    }

    .player-match-stats {
      font-size: 0.8em;
      color: #666;
      margin-top: 2px;
    }

    .player-match-stats span {
      margin-right: 8px;
    }

    .player-tournament-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .player-stat-card {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #eee;
    }

    .player-stat-card h5 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }

    .player-stat-details {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9em;
      color: #666;
    }
  `]
})
export class TournamentDialogComponent {
  constructor(
    public dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public tournament: Tournament
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  isWinner(match: Match, player: { id: number }): boolean {
    if (!match.completed) return false;
    if (match.player1.id === player.id) {
      return match.player1Score! > match.player2Score!;
    }
    return match.player2Score! > match.player1Score!;
  }

  getGroupStandings(group: { matches: Match[]; players: { id: number; name: string }[] }) {
    return group.players.map(player => {
      const matches = group.matches.filter(m => 
        m.completed && (m.player1.id === player.id || m.player2.id === player.id)
      );
      
      const points = matches.reduce((total, match) => {
        if ((match.player1.id === player.id && match.player1Score! > match.player2Score!) ||
            (match.player2.id === player.id && match.player2Score! > match.player1Score!)) {
          return total + 2;
        }
        return total;
      }, 0);

      return { player, points };
    }).sort((a, b) => b.points - a.points);
  }

  getMatchesByRound(round: string): Match[] {
    return this.tournament.knockoutMatches.filter(m => m.round === round);
  }

  getTotalMatches(): number {
    const groupMatches = this.tournament.groups.reduce(
      (total, group) => total + group.matches.filter(m => m.completed).length,
      0
    );
    const knockoutMatches = this.tournament.knockoutMatches.filter(m => m.completed).length;
    return groupMatches + knockoutMatches;
  }

  getTotalPointsScored(): number {
    let total = 0;
    
    // Group stage
    this.tournament.groups.forEach(group => {
      group.matches.forEach(match => {
        if (match.completed) {
          total += match.player1Score! + match.player2Score!;
        }
      });
    });

    // Knockout stage
    this.tournament.knockoutMatches.forEach(match => {
      if (match.completed) {
        total += match.player1Score! + match.player2Score!;
      }
    });

    return total;
  }

  getAverageScorePerMatch(): number {
    const totalMatches = this.getTotalMatches();
    return totalMatches > 0 ? this.getTotalPointsScored() / totalMatches : 0;
  }

  getPlayerTournamentStats(player: Player): PlayerTournamentStats {
    let total180s = 0;
    let total171s = 0;
    let highestFinish = 0;
    let bestLeg = 0;
    let totalFinishes = 0;
    let finishCount = 0;

    // Calculate from group matches
    this.tournament.groups.forEach(group => {
      group.matches.forEach(match => {
        if (!match.completed) return;

        if (match.player1.id === player.id && match.player1Stats) {
          total180s += match.player1Stats.count180s || 0;
          total171s += match.player1Stats.count171s || 0;
          highestFinish = Math.max(highestFinish, match.player1Stats.highestFinish || 0);
          bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
          if (match.player1Stats.highestFinish) {
            totalFinishes += match.player1Stats.highestFinish;
            finishCount++;
          }
        }
        
        if (match.player2.id === player.id && match.player2Stats) {
          total180s += match.player2Stats.count180s || 0;
          total171s += match.player2Stats.count171s || 0;
          highestFinish = Math.max(highestFinish, match.player2Stats.highestFinish || 0);
          bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
          if (match.player2Stats.highestFinish) {
            totalFinishes += match.player2Stats.highestFinish;
            finishCount++;
          }
        }
      });
    });

    // Calculate from knockout matches
    this.tournament.knockoutMatches.forEach(match => {
      if (!match.completed) return;

      if (match.player1.id === player.id && match.player1Stats) {
        total180s += match.player1Stats.count180s || 0;
        total171s += match.player1Stats.count171s || 0;
        highestFinish = Math.max(highestFinish, match.player1Stats.highestFinish || 0);
        bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
        if (match.player1Stats.highestFinish) {
          totalFinishes += match.player1Stats.highestFinish;
          finishCount++;
        }
      }
      
      if (match.player2.id === player.id && match.player2Stats) {
        total180s += match.player2Stats.count180s || 0;
        total171s += match.player2Stats.count171s || 0;
        highestFinish = Math.max(highestFinish, match.player2Stats.highestFinish || 0);
        bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
        if (match.player2Stats.highestFinish) {
          totalFinishes += match.player2Stats.highestFinish;
          finishCount++;
        }
      }
    });

    return {
      total180s,
      total171s,
      highestFinish,
      bestLeg,
      averageFinish: finishCount > 0 ? totalFinishes / finishCount : 0
    };
  }
}