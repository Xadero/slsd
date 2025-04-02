import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Player } from '../../../../models/tournament.model';

@Component({
  selector: 'app-player-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <h2>{{ isNewPlayer ? 'Add Player' : 'Change Player' }}</h2>
      
      <!-- Add New Player Section -->
      <div class="add-new-player">
        <input 
          type="text" 
          [(ngModel)]="newPlayerName" 
          placeholder="Enter new player name"
          class="new-player-input"
        />
        <button 
          class="btn primary" 
          [disabled]="!newPlayerName.trim()"
          (click)="addNewPlayer()">
          Add New Player
        </button>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Existing Players List -->
      <h3>Select Existing Player</h3>
      <div class="players-list">
        @for (player of availablePlayers; track player.id) {
          <div 
            class="player-item" 
            [class.selected]="selectedPlayer?.id === player.id"
            (click)="selectPlayer(player)">
            <span class="player-name">{{ player.name }}</span>
            <span class="player-points">Points: {{ player.totalPoints }}</span>
          </div>
        }
      </div>
      <div class="dialog-actions">
        <button class="btn" (click)="close()">Cancel</button>
        <button 
          class="btn primary" 
          [disabled]="!selectedPlayer"
          (click)="confirm()">
          Confirm Selection
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      min-width: 400px;
      max-width: 600px;
    }

    .add-new-player {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .new-player-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .divider {
      text-align: center;
      margin: 20px 0;
      position: relative;
    }

    .divider::before,
    .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 45%;
      height: 1px;
      background-color: #ddd;
    }

    .divider::before {
      left: 0;
    }

    .divider::after {
      right: 0;
    }

    .divider span {
      background-color: white;
      padding: 0 10px;
      color: #666;
      font-size: 14px;
    }

    .players-list {
      max-height: 300px;
      overflow-y: auto;
      margin: 20px 0;
    }

    .player-item {
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }

    .player-item:hover {
      background: #f5f5f5;
    }

    .player-item.selected {
      background: #e3f2fd;
      border-color: #2196f3;
    }

    .player-name {
      font-weight: 500;
    }

    .player-points {
      color: #666;
      font-size: 0.9em;
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
    }

    .btn.primary {
      background: #2196f3;
      color: white;
    }

    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    h3 {
      margin: 0;
      color: #333;
      font-size: 16px;
    }
  `]
})
export class PlayerSelectionDialogComponent {
  availablePlayers: Player[] = [];
  selectedPlayer: Player | null = null;
  isNewPlayer: boolean = false;
  newPlayerName: string = '';

  constructor(
    public dialogRef: MatDialogRef<PlayerSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      players: Player[],
      currentPlayer?: Player,
      isNewPlayer: boolean
    }
  ) {
    this.availablePlayers = data.players;
    this.isNewPlayer = data.isNewPlayer;
    if (data.currentPlayer) {
      this.selectedPlayer = data.currentPlayer;
    }
  }

  selectPlayer(player: Player) {
    this.selectedPlayer = player;
  }

  addNewPlayer() {
    if (this.newPlayerName.trim()) {
      const newPlayer: Player = {
        id: 0,
        name: this.newPlayerName.trim(),
        totalPoints: 0
      };
      this.dialogRef.close({player: newPlayer, created: true});
    }
  }

  confirm() {
    if (this.selectedPlayer) {
      this.dialogRef.close({player: this.selectedPlayer, created: false});
    }
  }

  close() {
    this.dialogRef.close();
  }
}