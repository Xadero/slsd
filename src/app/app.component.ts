import {Component, HostListener, OnDestroy, signal} from "@angular/core";
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
import { Tournament, TournamentSeries } from "./models/tournament.model";
import { IncompleteTournamentsDialogComponent } from "./components/incomplete-tournaments-dialog/incomplete-tournaments-dialog.component";
import { LiveTournamentsComponent } from "./components/live-tournaments/live-tournaments.component";

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
    LiveTournamentsComponent
],
})
export class AppComponent implements OnDestroy {
  showTournamentCreation = false;
  currentlyPlayedTournament: boolean = false;
  selectedSeries = signal<TournamentSeries | undefined>(undefined);
  selectedTournament = signal<Tournament | undefined>(undefined);
  currentTournament = signal<Tournament | null>(null);
  isLiveSelected = signal<boolean>(false);
  isNewTournament: boolean = false;
  protected isAdmin = false;
  private authSubscription: Subscription;
  showSecretButton = false;
  private keySequence: string[] = [];
  private secretCode = ['c', 'd', 'd', 't'];
  private lastKeyTime = 0;
  private readonly KEY_TIMEOUT = 1000; // 1 second timeout between keys

  constructor(
    private tournamentService: TournamentService,
    private authService: AuthService,
    private dialog: Dialog
  ) {
    this.tournamentService.getCurrentTournament().subscribe((tournament) => {
      this.currentlyPlayedTournament = !!tournament;
      this.currentTournament.set(tournament);
      this.isNewTournament = tournament ? !tournament.completed : false;
      if (tournament) {
        this.showTournamentCreation = false;
      }
    });

    if (!this.currentlyPlayedTournament) {
      this.showLastSeries();
    }

    this.authSubscription = this.authService
      .isAdminUser()
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const currentTime = Date.now();

    if (currentTime - this.lastKeyTime > this.KEY_TIMEOUT) {
      this.keySequence = [];
    }

    this.lastKeyTime = currentTime;
    this.keySequence.push(event.key.toLowerCase());

    // Keep only the last 4 keys
    if (this.keySequence.length > 4) {
      this.keySequence.shift();
    }

    // Check if the sequence matches the secret code
    if (this.arrayEquals(this.keySequence, this.secretCode)) {
      this.showSecretButton = true;
      // Reset the sequence
      this.keySequence = [];
    }
  }

  private arrayEquals(arr1: string[], arr2: string[]): boolean {
    return arr1.length === arr2.length &&
        arr1.every((value, index) => value === arr2[index]);
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  openLoginDialog(){
    this.dialog.open(AuthDialogComponent);
  }

  showIncompleteTournaments() {
    const dialogRef = this.dialog.open(IncompleteTournamentsDialogComponent);
    dialogRef.closed.subscribe((tournament) => {
      if (tournament) {
        this.tournamentService.setCurrentTournament(tournament as Tournament);
        this.currentlyPlayedTournament = true;
        this.showNewTournament()
      }
    });
  }

  async showNewTournament() {
    this.isLiveSelected.set(false);
    if (this.currentlyPlayedTournament) {
      this.selectedTournament.set(undefined);
      this.selectedSeries.set(undefined);
      return;
    }

    if (!this.isAdmin) {
      this.dialog.open(AuthDialogComponent);
      return;
    }

    this.selectedTournament.set(undefined);
    this.selectedSeries.set(undefined);
    this.showTournamentCreation = true;
    this.tournamentService.setCurrentTournament(null);
    this.tournamentService.setCurrentSeries(null);
  }

  showLastSeries() {
    this.isLiveSelected.set(false);
    this.tournamentService.getTournamentSeries().subscribe((series) => {
      if (this.isLiveSelected()) {
        return;
      }
      if (series.length > 0) {
        this.tournamentService.getTournamentHistory().subscribe((tournaments) => {
          if (this.isLiveSelected()) {
            return;
          }
          const latestTournament = tournaments.filter(x => x.completed).reduce((latest, current) =>
              current.date > latest.date ? current : latest
          );

          const lastSeries = series.find(ser => ser.id === latestTournament.series_id);
          if (lastSeries) {
            this.selectedSeriesDetails(lastSeries);
          }
        })
      }
    });
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  selectedTournamentDetails(tournament: Tournament) {
    this.isLiveSelected.set(false);
    this.selectedTournament.set(tournament);
    this.selectedSeries.set(undefined);
  }

  selectedSeriesDetails(tournamentSeries: TournamentSeries) {
    this.isLiveSelected.set(false);
    this.selectedSeries.set(tournamentSeries);
    this.selectedTournament.set(undefined);
  }

  showLiveTournaments() {
    this.isLiveSelected.set(true);
    this.selectedSeries.set(undefined);
    this.selectedTournament.set(undefined);
  }
}