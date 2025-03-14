import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { GroupStageDialogComponent } from "./tournament-group-stage-dialog/group-stage-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import {
  Group,
  Match,
  Player,
  Tournament,
} from "../../../models/tournament.model";
import { TournamentService } from "../../../services/tournament.service";

@Component({
  selector: "app-group-stage",
  standalone: true,
  imports: [CommonModule, FormsModule, MatAccordion, MatExpansionModule],
  templateUrl: "./tournament-group-stage.component.html",
  styleUrls: ["./tournament-group-stage.component.scss"],
})
export class GroupStageComponent {
  @Input() tournament!: Tournament;
  @Output() onMatchUpdate = new EventEmitter<Match>();
  @Output() onGroupStageComplete = new EventEmitter<number>();
  public showMatchesList: boolean = true;
  editingMatch: Match | null = null;
  qualifyingPlayers: number = 8;

  constructor(
    private tournamentService: TournamentService,
    public dialog: MatDialog
  ) {}

  getMatchResult(group: Group, player1: Player, player2: Player) {
    const match = group.matches.find(
      (m) =>
        (m.player1.id === player1.id && m.player2.id === player2.id) ||
        (m.player1.id === player2.id && m.player2.id === player1.id)
    );

    if (!match) return null;

    // Check if the match is reversed (i.e., if player1 is actually player2 in the match)
    const isReversed = match.player1.id === player2.id;
    const score = match.completed
      ? isReversed
        ? `${match.player2Score} : ${match.player1Score}`
        : `${match.player1Score} : ${match.player2Score}`
      : "";

    return {
      match: match, // Return the original match without modification
      score,
    };
  }

  validateScoreInput(event: KeyboardEvent): boolean {
    // Allow only numbers 0-3
    const input = event.key;
    const isNumber = /[0-3]/.test(input);
    if (!isNumber) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  formatScoreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove any non-numeric characters
    let cleanValue = value.replace(/[^0-3]/g, "");

    // Take only the first digit
    if (cleanValue.length > 0) {
      cleanValue = cleanValue[0];
    }

    // Update the input value
    input.value = cleanValue;
  }

  isModalOpen = false;

  openModal() {
    const dialogRef = this.dialog.open(GroupStageDialogComponent, {
      width: "400px",
      minHeight: "260px",
      height: "auto",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Selected players:", result);
        this.onGroupStageComplete.emit(result);
      }
    });
  }

  getPlayerPoints(group: Group, player: Player): number {
    return group.matches
      .filter(
        (m) =>
          m.completed &&
          (m.player1.id === player.id || m.player2.id === player.id)
      )
      .reduce((points, match) => {
        if (
          (match.player1.id === player.id &&
            match.player1Score! > match.player2Score!) ||
          (match.player2.id === player.id &&
            match.player2Score! > match.player1Score!)
        ) {
          return points + 2;
        }
        return points;
      }, 0);
  }

  private getPlayerBalance(
    group: Group,
    player: Player
  ): { scored: number; conceded: number } {
    let scored = 0;
    let conceded = 0;

    group.matches
      .filter(
        (m) =>
          m.completed &&
          (m.player1.id === player.id || m.player2.id === player.id)
      )
      .forEach((match) => {
        if (match.player1.id === player.id) {
          scored += match.player1Score!;
          conceded += match.player2Score!;
        } else {
          scored += match.player2Score!;
          conceded += match.player1Score!;
        }
      });

    return { scored, conceded };
  }

  public displayLegBalance(
    group: Group,
    player: Player,
    calculate = true
  ): string {
    const balance = this.getPlayerBalance(group, player);
    return calculate
      ? (balance.scored - balance.conceded).toString()
      : `${balance.scored}:${balance.conceded}`;
  }

  isValidScore(match: Match): boolean {
    return (
      match.player1Score !== undefined &&
      match.player1Score !== null &&
      match.player2Score !== undefined &&
      match.player2Score !== null &&
      match.player1Score !== match.player2Score &&
      match.player1Score >= 0 &&
      match.player1Score <= 3 &&
      match.player2Score >= 0 &&
      match.player2Score <= 3
    );
  }

  startEditing(match: Match) {
    if (match.completed) {
      this.editingMatch = match;
    }
  }

  submitResult(match: Match) {
    if (match.player1Score !== undefined && match.player2Score !== undefined) {
      match.player1Score = parseInt(match.player1Score.toString());
      match.player2Score = parseInt(match.player2Score.toString());
      match.player1Stats = match.player1Stats || {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0,
      };
      match.player2Stats = match.player2Stats || {
        count180s: 0,
        count171s: 0,
        highestFinish: 0,
        bestLeg: 0,
      };

      this.onMatchUpdate.emit(match);
      this.editingMatch = null;
    }
  }

  getAllGroupMatchesSorted(): Match[] {
    const allMatches: Match[] = [];
    const maxMatches = Math.max(
      ...this.tournament.groups.map((group) => group.matches.length)
    );

    for (let i = 0; i < maxMatches; i++) {
      this.tournament.groups.forEach((group) => {
        if (group.matches[i]) {
          allMatches.push(group.matches[i]);
        }
      });
    }

    return allMatches;
  }

  getPlayerGroupPosition(player: Player, groupId: number): string {
    const group = this.tournament?.groups.find((g) => g.id === groupId);
    if (!group) return "";

    const standings = this.tournamentService.getGroupStandings(group);
    const position = standings.findIndex((s) => s.player.id === player.id) + 1;
    return position ? `${position}${this.getOrdinalSuffix(position)}` : "";
  }

  private getOrdinalSuffix(n: number): string {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  areAllMatchesCompleted(): boolean {
    return this.tournament.groups.every((group) =>
      group.matches.every((match) => match.completed)
    );
  }

  getPlayerPlace(group: Group, player: Player): number {
    const standings = group.players.map((p) => {
      const points = this.getPlayerPoints(group, p);
      const balance = this.displayLegBalance(group, p, true);
      const headToHead = this.getHeadToHeadResult(group, p, points);
      return { player: p, points, balance, headToHead };
    });

    // Sort by points (descending), then balance, then head-to-head
    standings.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      if (a.balance !== b.balance) {
        return parseInt(b.balance.toString()) - parseInt(a.balance.toString());
      }
      if (a.headToHead !== b.headToHead) {
        return b.headToHead - a.headToHead;
      }
      return 0;
    });

    return standings.findIndex((s) => s.player.id === player.id) + 1;
  }

  private getHeadToHeadResult(
    group: Group,
    player: Player,
    playerPoints: number
  ): number {
    const match = group.matches.find(
      (m) =>
        (m.player1.id === player.id || m.player2.id === player.id) &&
        m.completed &&
        (this.getPlayerPoints(group, m.player1) === playerPoints ||
          this.getPlayerPoints(group, m.player2) === playerPoints)
    );

    if (!match) return 0;

    if (match.player1.id === player.id) {
      return match.player1Score! > match.player2Score! ? 1 : -1;
    } else {
      return match.player2Score! > match.player1Score! ? 1 : -1;
    }
  }
}
