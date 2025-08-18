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
    templateUrl: './live-tournaments.component.html',
    styleUrls: ['./live-tournaments.component.scss'],
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
      const standings = group.players.map((player: any) => {
        const matches = group.matches.filter(
          (m: any) =>
            m.completed &&
            (m.player1.id === player.id || m.player2.id === player.id)
        );

        let wins = 0;
        let legsWon = 0;
        let legsConceded = 0;

        matches.forEach((match: any) => {
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
          points: wins,
          legsWon,
          legsConceded,
          legDifference: legsWon - legsConceded
        };
      });

      // Sort standings with correct priority order
      const sortedStandings = standings.sort((a: any, b: any) => {
        // 1. First by points (highest first)
        if (a.points !== b.points) {
          return b.points - a.points;
        }

        // 2. Then by leg difference/balance (highest first) when points are equal
        if (a.legDifference !== b.legDifference) {
          return b.legDifference - a.legDifference;
        }

        // 3. Finally by head-to-head when both points and balance are equal
        if (a.points === b.points && a.legDifference === b.legDifference) {
          const headToHeadMatch = group.matches.find((m: any) =>
            m.completed &&
            ((m.player1.id === a.player.id && m.player2.id === b.player.id) ||
             (m.player2.id === a.player.id && m.player1.id === b.player.id))
          );

          if (headToHeadMatch) {
            let aWonHeadToHead = false;
            if (headToHeadMatch.player1.id === a.player.id) {
              aWonHeadToHead = headToHeadMatch.player1Score! > headToHeadMatch.player2Score!;
            } else {
              aWonHeadToHead = headToHeadMatch.player2Score! > headToHeadMatch.player1Score!;
            }
            
            // If a won head-to-head, a should be ranked higher (return -1)
            // If b won head-to-head, b should be ranked higher (return 1)
            return aWonHeadToHead ? -1 : 1;
          }
        }

        // If all else is equal, maintain current order
        return 0;
      });

      // Add position to each standing
      return sortedStandings.map((standing: any, index: number) => ({
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