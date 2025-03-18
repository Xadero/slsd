import {Component, effect, input} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TournamentService } from "../../services/tournament.service";
import {
  Tournament,
  TournamentSeries,
  PlayerRanking,
} from "../../models/tournament.model";
import { Dialog } from "@angular/cdk/dialog";
import { TournamentHistoryComponent } from "../tournament-history/tournament-history.component";

@Component({
  selector: "app-series-view",
  standalone: true,
  imports: [CommonModule, TournamentHistoryComponent],
  templateUrl: "./series-view.component.html",
  styleUrls: ["./series-view.component.scss"],
})
export class SeriesViewComponent {
  series = input.required<TournamentSeries>();
  seriesTournaments: Tournament[] = [];
  seriesRankings: PlayerRanking[] = [];
  Math = Math;

  constructor(
    private tournamentService: TournamentService,
    private dialog: Dialog
  ) {}

  loadSeries = effect(() => {
    if(!!this.series()) {
      this.loadSeriesData(this.series().id)
    }
  })

  private loadSeriesData(seriesId: string) {
    this.tournamentService.getTournamentHistory().subscribe((tournaments) => {
      this.seriesTournaments = tournaments
        .filter((t) => t.series_id === seriesId)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    this.tournamentService.getSeriesRankings(seriesId).subscribe((rankings) => {
      this.seriesRankings = rankings;
    });
  }

  getWinner(tournament: Tournament): { name: string } | null {
    if (!tournament.completed || tournament.knockoutMatches.length === 0) {
      return null;
    }

    const finalMatch = tournament.knockoutMatches.find(
      (m) => m.round === "Final" && m.completed
    );
    if (!finalMatch) return null;

    return finalMatch.player1Score! > finalMatch.player2Score!
      ? finalMatch.player1
      : finalMatch.player2;
  }

  openTournamentDetails(tournament: Tournament) {
    this.tournamentService.setCurrentTournament(tournament);
  }

  pointsColor(points: number): string {
    if (points === 60) {
      return "gold";
    }
    if (points === 48) {
      return "silver";
    } 

    if (points === 40) {
      return "brown";
    }

    return 'black';
  }
}
