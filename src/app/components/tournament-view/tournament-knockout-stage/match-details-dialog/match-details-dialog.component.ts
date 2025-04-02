import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Match } from '../../../../models/tournament.model';

@Component({
  selector: 'app-match-details-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <div class="match-header">
        <div class="player-score">
          <span class="player-name">{{ data.match.player1.name }}</span>
          <input type="number" [(ngModel)]="data.match.player1Score" class="score-input">
        </div>
        <span class="vs">-</span>
        <div class="player-score">
          <input type="number" [(ngModel)]="data.match.player2Score" class="score-input">
          <span class="player-name">{{ data.match.player2.name }}</span>
        </div>
      </div>

      <div class="stats-container">
        <div class="stats-header">Details</div>
        
        <div class="stats-grid">
          <div class="stat-row">
              <input type="number" [(ngModel)]="data.match.player1Stats!.count180s">
            <div class="stat-label">180's</div>
            <input type="number" [(ngModel)]="data.match.player2Stats!.count180s">
          </div>
          <div class="stat-row">
              <input type="number" [(ngModel)]="data.match.player1Stats!.count171s">
            <div class="stat-label">171's</div>
            <input type="number" [(ngModel)]="data.match.player2Stats!.count171s">
          </div>
          <div class="stat-row">
              <input type="number" [(ngModel)]="data.match.player1Stats!.highestFinish">
            <div class="stat-label">HF</div>
            <input type="number" [(ngModel)]="data.match.player2Stats!.highestFinish">
          </div>
          <div class="stat-row">
              <input type="number" [(ngModel)]="data.match.player1Stats!.bestLeg">
            <div class="stat-label">BL</div>
            <input type="number" [(ngModel)]="data.match.player2Stats!.bestLeg">
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn" (click)="close()">Cancel</button>
        <button 
          class="btn primary" 
          (click)="confirm()"
          [disabled]="!isValidScore()">
          Confirm
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      min-width: 400px;
      background: white;
      border-radius: 8px;
      width: auto;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .player-score {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .player-name {
      font-weight: 500;
      font-size: 1.1em;
    }

    .vs {
      font-size: 1.2em;
      color: #666;
    }

    .score-input {
      width: 50px;
      padding: 8px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .score {
      font-size: 1.2em;
      font-weight: 600;
      min-width: 30px;
      text-align: center;
    }

    .stats-container {
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 20px;
      place-items: center;
    }

    .stats-header {
      text-align: center;
      font-weight: 500;
      margin-bottom: 15px;
      color: #2c3e50;
    }

    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-row {
      display: grid;
      grid-template-columns: 100px 1fr 1fr;
      gap: 10px;
      align-items: center;

      input {
        max-width: 100px;
      }
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
      text-align: center;
    }

    .stat-row input {
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }

    .stat-row input:disabled {
      background: #f8f9fa;
      border-color: #eee;
      color: #666;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      background: #6c757d;
      color: white;
    }

    .btn.primary {
      background: #007bff;
    }

    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class MatchDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MatchDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: Match }
  ) {
    // Initialize stats objects if they don't exist
    if (!this.data.match.player1Stats) {
      this.data.match.player1Stats = {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0
      };
    }
    if (!this.data.match.player2Stats) {
      this.data.match.player2Stats = {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0
      };
    }
  }

  isValidScore(): boolean {
    return (
      this.data.match.player1Score !== undefined &&
      this.data.match.player2Score !== undefined &&
      this.data.match.player1Score !== this.data.match.player2Score &&
      this.data.match.player1Score >= 0 &&
      this.data.match.player2Score >= 0
    );
  }

  confirm() {
    if (this.isValidScore()) {
      this.data.match.completed = true;
      this.dialogRef.close(this.data.match);
    }
  }

  close() {
    this.dialogRef.close();
  }
}