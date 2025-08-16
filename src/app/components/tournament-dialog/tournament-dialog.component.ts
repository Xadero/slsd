import { Component, Inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import {
  Tournament,
  Match,
  PlayerTournamentStats,
  Player,
} from "../../models/tournament.model";
import { MatExpansionModule } from "@angular/material/expansion";
import { TournamentDetailsComponent } from "../tournament-details/tournament-details.component";

@Component({
  selector: "app-tournament-dialog",
  standalone: true,
  imports: [CommonModule, MatExpansionModule, TournamentDetailsComponent],
  templateUrl: "./tournament-dialog.component.html",
  styleUrl: "./tournament-dialog.component.scss",
})
export class TournamentDialogComponent {
  readonly panelOpenState = signal(false);
  constructor(
    public dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public tournament: Tournament
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  isWinner(match: Match, player: { id: number }): boolean {
    if (!match.completed) return false;
    if (match.player1.id === player.id) {
      return match.player1Score! > match.player2Score!;
    }
    return match.player2Score! > match.player1Score!;
  }

  getGroupStandings(group: {
    matches: Match[];
    players: { id: number; name: string }[];
  }) {
    return group.players
      .map((player) => {
        const matches = group.matches.filter(
          (m) =>
            m.completed &&
            (m.player1.id === player.id || m.player2.id === player.id)
        );

        const points = matches.reduce((total, match) => {
          if (
            (match.player1.id === player.id &&
              match.player1Score! > match.player2Score!) ||
            (match.player2.id === player.id &&
              match.player2Score! > match.player1Score!)
          ) {
            return total + 1;
          }
          return total;
        }, 0);

        return { player, points };
      })
      .sort((a, b) => b.points - a.points);
  }

  getMatchesByRound(round: string): Match[] {
    return this.tournament.knockoutMatches.filter((m) => m.round === round);
  }

  getTotalMatches(): number {
    const groupMatches = this.tournament.groups.reduce(
      (total, group) => total + group.matches.filter((m) => m.completed).length,
      0
    );
    const knockoutMatches = this.tournament.knockoutMatches.filter(
      (m) => m.completed
    ).length;
    return groupMatches + knockoutMatches;
  }

  getTotalPointsScored(): number {
    let total = 0;

    // Group stage
    this.tournament.groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (match.completed) {
          total += match.player1Score! + match.player2Score!;
        }
      });
    });

    // Knockout stage
    this.tournament.knockoutMatches.forEach((match) => {
      if (match.completed) {
        total += match.player1Score! + match.player2Score!;
      }
    });

    return total;
  }

  getAverageScorePerMatch(): number {
    const totalMatches = this.getTotalMatches();
    return totalMatches > 0 ? this.getTotalPointsScored() / totalMatches : 0;
  }

  getPlayerTournamentStats(player: Player): PlayerTournamentStats {
    let total180s = 0;
    let total171s = 0;
    let highestFinish = 0;
    let bestLeg = 0;
    let totalFinishes = 0;
    let finishCount = 0;

    // Calculate from group matches
    this.tournament.groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (!match.completed) return;

        if (match.player1.id === player.id && match.player1Stats) {
          total180s += match.player1Stats.count180s || 0;
          total171s += match.player1Stats.count171s || 0;
          highestFinish = Math.max(
            highestFinish,
            match.player1Stats.highestFinish || 0
          );
          bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
          if (match.player1Stats.highestFinish) {
            totalFinishes += match.player1Stats.highestFinish;
            finishCount++;
          }
        }

        if (match.player2.id === player.id && match.player2Stats) {
          total180s += match.player2Stats.count180s || 0;
          total171s += match.player2Stats.count171s || 0;
          highestFinish = Math.max(
            highestFinish,
            match.player2Stats.highestFinish || 0
          );
          bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
          if (match.player2Stats.highestFinish) {
            totalFinishes += match.player2Stats.highestFinish;
            finishCount++;
          }
        }
      });
    });

    // Calculate from knockout matches
    this.tournament.knockoutMatches.forEach((match) => {
      if (!match.completed) return;

      if (match.player1.id === player.id && match.player1Stats) {
        total180s += match.player1Stats.count180s || 0;
        total171s += match.player1Stats.count171s || 0;
        highestFinish = Math.max(
          highestFinish,
          match.player1Stats.highestFinish || 0
        );
        bestLeg = Math.max(bestLeg, match.player1Stats.bestLeg || 0);
        if (match.player1Stats.highestFinish) {
          totalFinishes += match.player1Stats.highestFinish;
          finishCount++;
        }
      }

      if (match.player2.id === player.id && match.player2Stats) {
        total180s += match.player2Stats.count180s || 0;
        total171s += match.player2Stats.count171s || 0;
        highestFinish = Math.max(
          highestFinish,
          match.player2Stats.highestFinish || 0
        );
        bestLeg = Math.max(bestLeg, match.player2Stats.bestLeg || 0);
        if (match.player2Stats.highestFinish) {
          totalFinishes += match.player2Stats.highestFinish;
          finishCount++;
        }
      }
    });

    return {
      total180s,
      total171s,
      highestFinish,
      bestLeg,
    };
  }
}
