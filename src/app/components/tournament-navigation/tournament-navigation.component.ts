import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TournamentService } from "../../services/tournament.service";
import { Tournament, TournamentSeries } from "../../models/tournament.model";
import { TournamentDialogComponent } from "../tournament-dialog/tournament-dialog.component";
import { Dialog } from "@angular/cdk/dialog";

@Component({
  selector: "app-tournament-navigation",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tournament-navigation.component.html",
  styleUrl: "./tournament-navigation.component.scss",
})
export class TournamentNavigationComponent implements OnInit, OnDestroy {
  tournamentSeries: TournamentSeries[] = [];
  tournaments: Tournament[] = [];
  isDropdownOpen = false;
  expandedSeries: TournamentSeries | null = null;
  private closeTimeout: any;

  constructor(
    private tournamentService: TournamentService,
    private dialog: Dialog
  ) {}

  ngOnInit() {
    this.tournamentService.getTournamentSeries().subscribe((series) => {
      this.tournamentSeries = series;
    });

    this.tournamentService.getTournamentHistory().subscribe((tournaments) => {
      this.tournaments = tournaments;
    });
  }

  ngOnDestroy() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

  openDropdown() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.isDropdownOpen = true;
  }

  closeDropdown() {
    this.closeTimeout = setTimeout(() => {
      this.isDropdownOpen = false;
      this.expandedSeries = null;
    }, 300);
  }

  expandSeries(series: TournamentSeries) {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.expandedSeries = series;
  }

  getTournamentsBySeries(series: TournamentSeries): Tournament[] {
    return this.tournaments.filter((t) => t.series_id === series.id);
  }

  openTournamentDetails(tournament: Tournament) {
    this.tournamentService.setCurrentTournament(tournament);
    this.isDropdownOpen = false;
    this.expandedSeries = null;
  }

  openSeriesDetails(series: TournamentSeries) {
    this.tournamentService.setCurrentSeries(series);
    this.tournamentService.setCurrentTournament(null);
    this.isDropdownOpen = false;
    this.expandedSeries = null;
  }
}
