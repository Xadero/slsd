import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TournamentService } from '../../services/tournament.service';
import { Tournament, Match } from '../../models/tournament.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-live-tournaments',
    standalone: true,
    imports: [CommonModule, MatTabsModule, MatExpansionModule],
    template: `
      <div class="live-container">
        <h2>Live Tournaments</h2>
        
        @if (incompleteTournaments.length === 0) {
          <div class="no-tournaments">
            No active tournaments at the moment
          </div>
        } @else {
          <mat-accordion [multi]="true">
            @for (tournament of incompleteTournaments; track tournament.id) {
              <mat-expansion-panel [expanded]="true">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    {{ tournament.name }}
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ tournament.date | date:'medium' }}
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <mat-tab-group>
                  <!-- All Matches Tab -->
                  <mat-tab label="Wszystkie mecze">
                    <div class="matches-list">
                      @for (match of getAllMatches(tournament); track match.id) {
                        <div class="match-item" [class.completed]="match.completed">
                          <div class="match-header">
                            @if (match.groupId !== undefined) {
                              <span class="group-label">Grupa {{ match.groupId + 1 }}</span>
                            } @else {
                              <span class="round-label">{{ match.round }}</span>
                            }
                          </div>
                          <div class="match-players">
                            <div class="player" [class.winner]="isWinner(match, match.player1)">
                              {{ match.player1.name }}
                            </div>
                            <div class="match-score">
                              {{ match.completed ? match.player1Score + ' : ' + match.player2Score : 'vs' }}
                            </div>
                            <div class="player second" [class.winner]="isWinner(match, match.player2)">
                              {{ match.player2.name }}
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </mat-tab>
  
                  <!-- Groups Tab -->
                  <mat-tab label="Groups">
                    @for (group of tournament.groups; track group.id) {
                      <div class="group-section">
                        <h4>Grupa {{ group.id + 1 }}</h4>
                        <table class="standings-table">
                          <thead>
                            <tr>
                              <th>Miejsce</th>
                              <th>Gracz</th>
                              <th>Mecze</th>
                              <th>Wygrane</th>
                              <th>Przegrane</th>
                              <th>Punkty</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (standing of getGroupStandings(group); track standing.player.id) {
                              <tr>
                                <td>{{ standing.position }}</td>
                                <td>{{ standing.player.name }}</td>
                                <td>{{ standing.matches }}</td>
                                <td>{{ standing.wins }}</td>
                                <td>{{ standing.losses }}</td>
                                <td>{{ standing.points }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                        <div class="matches-list">
                        @for (match of group.matches; track match.id) {
                            <div class="match-item" [class.completed]="match.completed">
                            <div class="match-header">
                                @if (match.groupId !== undefined) {
                                <span class="group-label">Grupa {{ match.groupId + 1 }}</span>
                                } @else {
                                <span class="round-label">{{ match.round }}</span>
                                }
                            </div>
                            <div class="match-players">
                                <div class="player" [class.winner]="isWinner(match, match.player1)">
                                {{ match.player1.name }}
                                </div>
                                <div class="match-score">
                                {{ match.completed ? match.player1Score + ' : ' + match.player2Score : 'vs' }}
                                </div>
                                <div class="player" [class.winner]="isWinner(match, match.player2)">
                                {{ match.player2.name }}
                                </div>
                            </div>
                            </div>
                        }
                    </div>
                      </div>
                    }
                  </mat-tab>
  
                  <!-- Knockout Tab -->
                  @if (tournament.knockoutStageStarted) {
                    <mat-tab label="Drabinka">
                      <div class="knockout-section">
                        @for (round of getKnockoutRounds(tournament); track round) {
                          <div class="round-section">
                            <h4>{{ round }}</h4>
                            @for (match of getMatchesByRound(tournament, round); track match.id) {
                              <div class="match-item" [class.completed]="match.completed">
                                <div class="match-players">
                                  <div class="player" [class.winner]="isWinner(match, match.player1)">
                                    {{ match.player1.name }}
                                  </div>
                                  <div class="match-score">
                                    {{ match.completed ? match.player1Score + ' : ' + match.player2Score : 'vs' }}
                                  </div>
                                  <div class="player" [class.winner]="isWinner(match, match.player2)">
                                    {{ match.player2.name }}
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </mat-tab>
                  }
                </mat-tab-group>
              </mat-expansion-panel>
            }
          </mat-accordion>
        }
      </div>
    `,
    styles: [`
      .live-container {
        padding: 20px;
      }
  
      .no-tournaments {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.2em;
      }
  
      .matches-list {
        padding: 20px;
      }
  
      .match-item {
        border: 1px solid #eee;
        border-radius: 6px;
        margin-bottom: 10px;
        overflow: hidden;
      }
  
      .match-item.completed {
        border-color: #28a745;
      }
  
      .match-header {
        background: #f8f9fa;
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
      }
  
      .match-players {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 10px;
        padding: 12px;
        align-items: center;
      }
  
      .player {
        padding: 8px;
        text-align: right;
      }
      .second {
        text-align: left !important;
      }
  
      .player.winner {
        font-weight: bold;
        color: #28a745;
      }
  
      .match-score {
        font-weight: 500;
        color: #2c3e50;
        text-align: center;
        width: max-content;
        min-width: 80px;
      }
  
      .group-section {
        padding: 20px;
      }
  
      .standings-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
  
      .standings-table th,
      .standings-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
  
      .standings-table th {
        background: #f8f9fa;
        font-weight: 600;
      }
  
      .knockout-section {
        padding: 20px;
      }
  
      .round-section {
        margin-bottom: 30px;
      }
  
      .round-section h4 {
        margin-bottom: 15px;
        color: #2c3e50;
      }
  
      :host ::ng-deep {
        .mat-expansion-panel {
          margin-bottom: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
  
        .mat-expansion-panel-header {
          padding: 20px;
        }
  
        .mat-expansion-panel-header-title {
          color: #2c3e50;
          font-weight: 500;
        }
  
        .mat-expansion-panel-header-description {
          color: #666;
        }
  
        .mat-tab-body-wrapper {
          padding: 20px 0;
        }
      }
    `]
  })
  export class LiveTournamentsComponent implements OnInit, OnDestroy {
    incompleteTournaments: Tournament[] = [];
    private updateSubscription?: Subscription;
  
    constructor(private tournamentService: TournamentService) {}
  
    ngOnInit() {
      // Initial load
      this.loadIncompleteTournaments();
      
      // Set up polling every 5 seconds
      this.updateSubscription = interval(5000).subscribe(() => {
        this.loadIncompleteTournaments();
      });
    }

    ngOnDestroy() {
      if (this.updateSubscription) {
        this.updateSubscription.unsubscribe();
      }
    }

    private loadIncompleteTournaments() {
      this.tournamentService.getIncompleteTournaments().subscribe(
        tournaments => {
          this.incompleteTournaments = tournaments;
        }
      );
    }

    getAllMatches(tournament: Tournament): Match[] {
      const groupMatches: Match[] = [];
      const maxMatches = Math.max(
          ...tournament.groups.map((group) => group.matches.length)
      );
  
      for (let i = 0; i < maxMatches; i++) {
        tournament.groups.forEach((group) => {
          if (group.matches[i]) {
              groupMatches.push(group.matches[i]);
          }
        });
      }
  
      return [...groupMatches, ...tournament.knockoutMatches];
    }
  
    getGroupStandings(group: any) {
      return this.tournamentService.getGroupStandings(group)
        .map((standing, index) => ({
          ...standing,
          position: index + 1
        }));
    }
  
    getKnockoutRounds(tournament: Tournament): string[] {
      const rounds = new Set(tournament.knockoutMatches.map(m => m.round!));
      return Array.from(rounds).sort((a, b) => this.getRoundOrder(a) - this.getRoundOrder(b));
    }
  
    getMatchesByRound(tournament: Tournament, round: string): Match[] {
      return tournament.knockoutMatches.filter(m => m.round === round);
    }
  
    private getRoundOrder(round: string): number {
      const order = {
        'Round-16': 1,
        'Quarter-Finals': 2,
        'Semi-Finals': 3,
        'Final': 4,
        'Third-Place': 5
      };
      return order[round as keyof typeof order] || 99;
    }
  
    isWinner(match: Match, player: any): boolean {
      if (!match.completed) return false;
      if (match.player1.id === player.id) {
        return match.player1Score! > match.player2Score!;
      }
      return match.player2Score! > match.player1Score!;
    }
  }