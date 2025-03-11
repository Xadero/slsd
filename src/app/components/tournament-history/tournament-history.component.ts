import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { TournamentService } from '../../services/tournament.service';
import { Tournament, PlayerRanking } from '../../models/tournament.model';
import { TournamentDialogComponent } from '../tournament-dialog/tournament-dialog.component';

@Component({
  selector: 'app-tournament-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <h2>Tournament History</h2>
      
      <div class="tournaments-list">
        <div *ngFor="let tournament of tournaments" 
             class="tournament-card"
             (click)="openTournamentDetails(tournament)">
          <div class="tournament-header">
            <h3>{{ tournament.name }}</h3>
            <span class="date">{{ tournament.date | date:'mediumDate' }}</span>
          </div>
          
          <div class="tournament-stats">
            <div class="stat">
              <span class="label">Players:</span>
              <span class="value">{{ tournament.participants.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Groups:</span>
              <span class="value">{{ tournament.groups.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Winner:</span>
              <span class="value">{{ getWinner(tournament)?.name || 'N/A' }}</span>
            </div>
          </div>

          <div class="tournament-details">
            <h4>Top 3 Players</h4>
            <ol class="top-players">
              <li *ngFor="let player of getTopPlayers(tournament)">
                {{ player.name }} - {{ getPlayerPoints(tournament, player) }} points
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div class="rankings-container">
        <h2>Overall Rankings</h2>
        <div class="table-container">
          <table class="rankings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Total Points</th>
                <th *ngFor="let tournament of tournaments; let i = index">T{{ i + 1 }}</th>
                <th>180s</th>
                <th>171s</th>
                <th>HF</th>
                <th>BL</th>
                <th>Leg +/-</th>
                <th>Matches</th>
                <th>Legs</th>
                <th>Won Legs %</th>
                <th>Won Matches %</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ranking of playerRankings; let i = index">
                <td>{{ i + 1 }}</td>
                <td>{{ ranking.player.name }}</td>
                <td>{{ ranking.totalPoints }}</td>
                <td *ngFor="let tournament of tournaments; let j = index">
                  {{ ranking.tournamentPoints[j] || '-' }}
                </td>
                <td>{{ ranking.total180s }}</td>
                <td>{{ ranking.total171s }}</td>
                <td>{{ ranking.highestFinish }}</td>
                <td>{{ ranking.bestLeg }}</td>
                <td>{{ ranking.legDifference }}</td>
                <td>{{ ranking.matchesPlayed }}</td>
                <td>{{ ranking.legsPlayed }}</td>
                <td>{{ ranking.wonLegsPercentage | number:'1.1-1' }}%</td>
                <td>{{ ranking.wonMatchesPercentage | number:'1.1-1' }}%</td>
                <td>
                  <span [class.up]="ranking.rankChange > 0" [class.down]="ranking.rankChange < 0">
                    {{ ranking.rankChange > 0 ? '↑' : ranking.rankChange < 0 ? '↓' : '-' }}
                    {{ ranking.rankChange !== 0 ? Math.abs(ranking.rankChange) : '' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 20px;
    }

    .tournaments-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .tournament-card {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 15px;
      background: #f8f9fa;
      transition: transform 0.2s;
      cursor: pointer;
    }

    .tournament-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .tournament-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .tournament-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .date {
      color: #666;
      font-size: 0.9em;
    }

    .tournament-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
      padding: 10px;
      background: white;
      border-radius: 6px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .label {
      font-size: 0.8em;
      color: #666;
      margin-bottom: 4px;
    }

    .value {
      font-weight: 500;
      color: #2c3e50;
    }

    .tournament-details {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .tournament-details h4 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }

    .top-players {
      margin: 0;
      padding-left: 20px;
    }

    .top-players li {
      margin-bottom: 5px;
      color: #444;
    }

    .rankings-container {
      margin-top: 40px;
    }

    .table-container {
      overflow-x: auto;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .rankings-table {
      width: 100%;
      border-collapse: collapse;
      white-space: nowrap;
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
      color: #2c3e50;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .up {
      color: green;
    }

    .down {
      color: red;
    }
  `]
})
export class TournamentHistoryComponent implements OnInit {
  tournaments: Tournament[] = [];
  playerRankings: PlayerRanking[] = [];
  Math = Math;

  constructor(
    private tournamentService: TournamentService,
    private dialog: Dialog
  ) {}

  ngOnInit() {
    this.tournamentService.getTournamentHistory().subscribe(
      tournaments => this.tournaments = tournaments
    );
    this.tournamentService.getPlayerRankings().subscribe(
      rankings => this.playerRankings = rankings
    );
  }

  openTournamentDetails(tournament: Tournament) {
    this.dialog.open(TournamentDialogComponent, {
      data: tournament,
      panelClass: 'tournament-dialog'
    });
  }

  getWinner(tournament: Tournament): { name: string } | null {
    if (!tournament.completed || tournament.knockoutMatches.length === 0) {
      return null;
    }

    const finalMatch = tournament.knockoutMatches.find(m => m.round === 'Final' && m.completed);
    if (!finalMatch) return null;

    return finalMatch.player1Score! > finalMatch.player2Score! 
      ? finalMatch.player1 
      : finalMatch.player2;
  }

  getTopPlayers(tournament: Tournament): { name: string }[] {
    const playerPoints = new Map<number, { name: string; points: number }>();

    // Calculate points from group stage
    tournament.groups.forEach(group => {
      group.matches.forEach(match => {
        if (!match.completed) return;

        const winner = match.player1Score! > match.player2Score! ? match.player1 : match.player2;
        const current = playerPoints.get(winner.id) || { name: winner.name, points: 0 };
        playerPoints.set(winner.id, { ...current, points: current.points + 2 });
      });
    });

    // Add points from knockout stage
    tournament.knockoutMatches.forEach(match => {
      if (!match.completed) return;

      const winner = match.player1Score! > match.player2Score! ? match.player1 : match.player2;
      const points = match.round === 'Final' ? 12 : match.round === 'Semi-Finals' ? 8 : 5;
      const current = playerPoints.get(winner.id) || { name: winner.name, points: 0 };
      playerPoints.set(winner.id, { ...current, points: current.points + points });
    });

    return Array.from(playerPoints.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }

  getPlayerPoints(tournament: Tournament, player: { name: string }): number {
    let points = 0;

    // Group stage points
    tournament.groups.forEach(group => {
      group.matches.forEach(match => {
        if (!match.completed) return;
        if ((match.player1.name === player.name && match.player1Score! > match.player2Score!) ||
            (match.player2.name === player.name && match.player2Score! > match.player1Score!)) {
          points += 2;
        }
      });
    });

    // Knockout stage points
    tournament.knockoutMatches.forEach(match => {
      if (!match.completed) return;
      if ((match.player1.name === player.name && match.player1Score! > match.player2Score!) ||
          (match.player2.name === player.name && match.player2Score! > match.player1Score!)) {
        points += match.round === 'Final' ? 12 : match.round === 'Semi-Finals' ? 8 : 5;
      }
    });

    return points;
  }
}