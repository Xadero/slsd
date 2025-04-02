import { Component, input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Dialog } from "@angular/cdk/dialog";
import { TournamentService } from "../../services/tournament.service";
import { Tournament, PlayerRanking } from "../../models/tournament.model";
import { TournamentDialogComponent } from "../tournament-dialog/tournament-dialog.component";

@Component({
  selector: "app-tournament-history",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tournament-history.component.html",
  styleUrl: "./tournament-history.component.scss",
})
export class TournamentHistoryComponent implements OnInit {
  tournaments = input<Tournament[]>();
  playerRankings: PlayerRanking[] = [];
  Math = Math;

  constructor(
    private tournamentService: TournamentService,
    private dialog: Dialog
  ) {}

  ngOnInit() {

    this.tournamentService
      .getPlayerRankings()
      .subscribe((rankings) => (this.playerRankings = rankings));
  }

  openTournamentDetails(tournament: Tournament) {
    this.dialog.open(TournamentDialogComponent, {
      data: tournament,
      panelClass: "tournament-dialog",
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

  getTopPlayers(tournament: Tournament): { name: string }[] {
    const playerPoints = new Map<number, { name: string; points: number }>();

    // Calculate points from group stage
    tournament.groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (!match.completed) return;

        const winner =
          match.player1Score! > match.player2Score!
            ? match.player1
            : match.player2;
        const current = playerPoints.get(winner.id) || {
          name: winner.name,
          points: 0,
        };
        playerPoints.set(winner.id, { ...current, points: current.points + 2 });
      });
    });

    // Add points from knockout stage
    tournament.knockoutMatches.forEach((match) => {
      if (!match.completed) return;

      const winner =
        match.player1Score! > match.player2Score!
          ? match.player1
          : match.player2;
      const points =
        match.round === "Final" ? 12 : match.round === "Semi-Finals" ? 8 : 5;
      const current = playerPoints.get(winner.id) || {
        name: winner.name,
        points: 0,
      };
      playerPoints.set(winner.id, {
        ...current,
        points: current.points + points,
      });
    });

    return Array.from(playerPoints.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }

  // getPlayerPoints(tournament: Tournament, player: { name: string }): number {
  //   let points = 0;

  //   // Group stage points
  //   tournament.groups.forEach((group) => {
  //     group.matches.forEach((match) => {
  //       if (!match.completed) return;
  //       if (
  //         (match.player1.name === player.name &&
  //           match.player1Score! > match.player2Score!) ||
  //         (match.player2.name === player.name &&
  //           match.player2Score! > match.player1Score!)
  //       ) {
  //         points += 2;
  //       }
  //     });
  //   });

  //   // Knockout stage points
  //   tournament.knockoutMatches.forEach((match) => {
  //     if (!match.completed) return;
  //     if (
  //       (match.player1.name === player.name &&
  //         match.player1Score! > match.player2Score!) ||
  //       (match.player2.name === player.name &&
  //         match.player2Score! > match.player1Score!)
  //     ) {
  //       points +=
  //         match.round === "Final" ? 12 : match.round === "Semi-Finals" ? 8 : 5;
  //     }
  //   });

  //   return points;
  // }
}
