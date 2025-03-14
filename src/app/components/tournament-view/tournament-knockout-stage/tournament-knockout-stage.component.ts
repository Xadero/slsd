import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Tournament, Match, Player } from "../../../models/tournament.model";
import {TournamentService} from "../../../services/tournament.service";
import {map, Observable, of, switchMap} from "rxjs";

@Component({
  selector: "app-tournament-knockout-stage",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./tournament-knockout-stage.component.html",
  styleUrls: ["./tournament-knockout-stage.component.scss"],
})
export class TournamentKnockoutStageComponent {
  @Input() matches: Match[] = [];
  @Input() onSubmitResult!: (match: Match) => void;

  constructor(private tournamentService: TournamentService) {

  }
  hasRoundOf16(): boolean {
    return this.matches.some((m) => m.round === "Round-16");
  }

  getRoundMatches(round: string): Match[] {
    return this.matches.filter((m) => m.round === round);
  }

  getFinalMatch(): Match | undefined {
    return this.matches.find((m) => m.round === "Final");
  }

  getThirdPlaceMatch(): Match | undefined {
    return this.matches.find((m) => m.round === "Third-Place");
  }

  getPlayerSeed(player: Player): Observable<string> {
    return this.tournamentService.getCurrentTournament().pipe(
        switchMap(tournament => {
          if (!!tournament && !!tournament.series_id) {
            return this.tournamentService.getSeriesRankings(tournament.series_id).pipe(
                map(rankings => {
                  const playerIndex = rankings.findIndex(rank => player.id === rank.player.id);
                  return playerIndex !== -1 ? (playerIndex + 1).toString() : '-';
                })
            );
          }
          return of('-');
        })
    );
  }


  isWinner(match: Match, player: Player): boolean {
    if (!match.completed) return false;
    if (match.player1.id === player.id) {
      return match.player1Score! > match.player2Score!;
    }
    return match.player2Score! > match.player1Score!;
  }

  isValidScore(match: Match): boolean {
    return (
      match.player1Score !== undefined &&
      match.player2Score !== undefined &&
      match.player1Score !== match.player2Score &&
      match.player1Score >= 0 &&
      match.player2Score >= 0
    );
  }

  submitResult(match: Match) {
    if (this.onSubmitResult && this.isValidScore(match)) {
      this.onSubmitResult(match);
    }
  }
}
