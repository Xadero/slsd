import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TournamentService } from "../../services/tournament.service";
import {
  Tournament,
  Player,
  Match,
  PlayerRanking,
  TournamentSeries,
} from "../../models/tournament.model";
import { TournamentKnockoutStageComponent } from "./tournament-knockout-stage/tournament-knockout-stage.component";
import { GroupStageComponent } from "./tournament-group-stage/tournament-group-stage.component";

@Component({
  selector: "app-tournament-view",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TournamentKnockoutStageComponent,
    GroupStageComponent,
  ],
  templateUrl: "./tournament-view.component.html",
  styleUrl: "./tournament-view.component.scss",
})
export class TournamentViewComponent implements OnInit {
  tournament: Tournament | null = null;
  playerRankings: PlayerRanking[] = [];
  tournamentSeries: TournamentSeries[] = [];
  newTournamentName: string = "";
  newPlayerName: string = "";
  newSeriesName: string = "";
  selectedSeriesId: string = "";
  showNewSeriesInput: boolean = false;
  participants: Player[] = [];
  availablePlayers: Player[] = [];
  showMatchesList = true;
  Math = Math;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit() {
    this.tournamentService.getCurrentTournament().subscribe((tournament) => {
      this.tournament = tournament;
    });
    this.tournamentService.getPlayerRankings().subscribe((rankings) => {
      this.playerRankings = rankings;
      this.availablePlayers = rankings.map((r) => ({
        id: r.player.id,
        name: r.player.name,
        totalPoints: r.totalPoints,
      }));
    });
    this.tournamentService
      .getTournamentSeries()
      .subscribe((series) => (this.tournamentSeries = series));
  }

  async createNewSeries() {
    if (this.newSeriesName.trim()) {
      try {
        await this.tournamentService.createTournamentSeries(
          this.newSeriesName.trim()
        );
        this.newSeriesName = "";
        this.showNewSeriesInput = false;
      } catch (error) {
        console.error("Error creating series:", error);
      }
    }
  }

  isPlayerSelected(player: Player): boolean {
    return this.participants.some((p) => p.id === player.id);
  }

  togglePlayer(player: Player) {
    if (this.isPlayerSelected(player)) {
      this.removePlayer(player);
    } else {
      this.participants.push(player);
    }
  }

  addNewPlayer() {
    if (this.newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now(),
        name: this.newPlayerName.trim(),
        totalPoints: 0,
      };
      this.participants.push(newPlayer);
      this.newPlayerName = "";
    }
  }

  removePlayer(player: Player) {
    this.participants = this.participants.filter((p) => p.id !== player.id);
  }

  createTournament() {
    if (this.newTournamentName && this.participants.length >= 4) {
      this.tournamentService.createTournament(
        this.newTournamentName,
        this.participants,
        this.selectedSeriesId || undefined
      );
    }
  }

  handleMatchUpdate(match: Match) {
    if (match.player1Score !== undefined && match.player2Score !== undefined) {
      this.tournamentService.updateMatchResult(
        match,
        match.player1Score,
        match.player2Score
      );
    }
  }

  handleGroupStageComplete(qualifyingPlayers: number) {
    if (this.tournament) {
      this.tournamentService.completeGroupStage(
        this.tournament,
        qualifyingPlayers
      );
    }
  }

  returnToGroupStage() {
    if (this.tournament) {
      const updatedTournament = {
        ...this.tournament,
        knockoutStageStarted: false,
        knockoutMatches: [],
      };
      this.tournamentService.setCurrentTournament(updatedTournament);
    }
  }

  canCompleteTournament(): boolean {
    return (
      this.tournament?.knockoutStageStarted === true &&
      this.tournament.knockoutMatches.every((m) => m.completed)
    );
  }

  completeTournament() {
    if (this.canCompleteTournament()) {
      this.tournamentService.completeTournament();
    }
  }

  abandonTournament() {
    this.tournamentService.abandonTournament();
  }

  onSubmitKnockoutResult(match: Match) {
    this.handleMatchUpdate(match);
  }
}
