import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';
import { TournamentService } from '../../services/tournament.service';
import { Tournament } from '../../models/tournament.model';

@Component({
  selector: 'app-incomplete-tournaments-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="incomplete-tournaments-dialog">
      <h2>Niedokończone turnieje</h2>
      <div class="tournaments-list">
        @for (tournament of incompleteTournaments; track tournament.id) {
          <div class="tournament-item" (click)="selectTournament(tournament)">
            <div class="tournament-name">{{ tournament.name }}</div>
            <div class="tournament-date">{{ tournament.date | date:'medium' }}</div>
          </div>
        }
        @if (incompleteTournaments.length === 0) {
          <div class="no-tournaments">Brak niedokończonych turniejów</div>
        }
      </div>
      <div class="dialog-actions">
        <button class="btn" (click)="close()">Zamknij</button>
      </div>
    </div>
  `,
  styles: [`
    .incomplete-tournaments-dialog {
      background: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 400px;
    }

    h2 {
      margin: 0 0 20px 0;
      color: #2c3e50;
    }

    .tournaments-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .tournament-item {
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 6px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tournament-item:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
    }

    .tournament-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .tournament-date {
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }

    .no-tournaments {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .dialog-actions {
      margin-top: 20px;
      text-align: right;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
    }

    .btn:hover {
      background: #0056b3;
    }
  `]
})
export class IncompleteTournamentsDialogComponent implements OnInit {
  incompleteTournaments: Tournament[] = [];

  constructor(
    private dialogRef: DialogRef<Tournament>,
    private tournamentService: TournamentService
  ) {}

  ngOnInit() {
    this.tournamentService.getIncompleteTournaments().subscribe(
      tournaments => this.incompleteTournaments = tournaments
    );
  }

  selectTournament(tournament: Tournament) {
    this.dialogRef.close(tournament);
  }

  close() {
    this.dialogRef.close();
  }
}