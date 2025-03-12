import { Component, OnDestroy } from "@angular/core";
import { TournamentViewComponent } from "./components/tournament-view/tournament-view.component";
import { SeriesViewComponent } from "./components/series-view/series-view.component";
import { TournamentNavigationComponent } from "./components/tournament-navigation/tournament-navigation.component";
import { TournamentDetailsComponent } from "./components/tournament-details/tournament-details.component";
import { CommonModule } from "@angular/common";
import { TournamentService } from "./services/tournament.service";
import { Subscription } from "rxjs";
import { AuthService } from "./services/auth.service";
import { AuthDialogComponent } from "./components/auth-dialog/auth-dialog.component";
import { Dialog } from "@angular/cdk/dialog";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: true,
  imports: [
    TournamentViewComponent,
    SeriesViewComponent,
    TournamentNavigationComponent,
    TournamentDetailsComponent,
    CommonModule,
  ],
})
export class AppComponent implements OnDestroy {
  showTournamentCreation = false;
  selectedTournament: boolean = false;
  selectedSeries: boolean = false;
  isNewTournament: boolean = false;
  private isAdmin = false;
  private authSubscription: Subscription;

  constructor(
    private tournamentService: TournamentService,
    private authService: AuthService,
    private dialog: Dialog
  ) {
    this.tournamentService.getCurrentTournament().subscribe((tournament) => {
      this.selectedTournament = !!tournament;
      this.isNewTournament = tournament ? !tournament.completed : false;
      if (tournament) {
        this.showTournamentCreation = false;
      }
    });

    this.tournamentService.getCurrentSeries().subscribe((series) => {
      this.selectedSeries = !!series;
    });

    this.authSubscription = this.authService
      .isAdminUser()
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  async showNewTournament() {
    const x = this.authService.getCurrentUser().subscribe((user) => {
      console.log(user);
      if (!user) {
        console.log(user);
      }
    });
    if (!this.isAdmin) {
      this.dialog.open(AuthDialogComponent);
      return;
    }
    this.showTournamentCreation = true;
    this.tournamentService.setCurrentTournament(null);
    this.tournamentService.setCurrentSeries(null);
  }

  showLastSeries() {
    this.tournamentService.getTournamentSeries().subscribe((series) => {
      if (series.length > 0) {
        // Sort series by date and get the most recent one
        const lastSeries = series.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        this.tournamentService.setCurrentSeries(lastSeries);
        this.tournamentService.setCurrentTournament(null);
        this.showTournamentCreation = false;
      }
    });
  }
}
