import {Component, Input, Output, EventEmitter, input, signal, OnInit, model, effect} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { GroupStageDialogComponent } from "./tournament-group-stage-dialog/group-stage-dialog.component";
import { PlayerSelectionDialogComponent } from "./player-selection-dialog/player-selection-dialog.component";
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
export class GroupStageComponent implements OnInit {
  tournament = model<Tournament | null>(null);
  @Output() onMatchUpdate = new EventEmitter<Match>();
  @Output() onGroupStageComplete = new EventEmitter<number>();
  @Output() onGroupUpdate = new EventEmitter<{participants: Player[], groupId: number, allMatches: Match[]}>();
  availablePlayers = input<Player[]>([]);
  public showMatchesList: boolean = true;
  editingMatch: Match | null = null;
  allMatches = signal<Match[]>([]);

  constructor(
    private tournamentService: TournamentService,
    public dialog: MatDialog
  ) {}

  refreshAllMatches = effect(() => { 
    if (this.tournament()){
      this.getAllGroupMatchesSorted()
    }
  })

  ngOnInit() {
    this.getAllGroupMatchesSorted();
  }

  getMatchResult(group: Group, player1: Player, player2: Player) {
    const match = group.matches.find(
      (m) =>
        (m.player1.id === player1.id && m.player2.id === player2.id) ||
        (m.player1.id === player2.id && m.player2.id === player1.id)
    );

    if (!match) return null;

    const isReversed = match.player1.id === player2.id;
    const score = match.completed
      ? isReversed
          ? `${match.player2Score} : ${match.player1Score}`
          : `${match.player1Score} : ${match.player2Score}`
      : "";

    return {
      match: match,
      score,
    };
  }

  formatScoreInput(event: Event, match: Match, player1: boolean): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    let cleanValue = value.replace(/[^0-3]/g, "");

    if (cleanValue.length > 0) {
      cleanValue = cleanValue[0];
    }

    input.value = cleanValue;
    if (player1) {
      match.player1Score = parseInt(cleanValue);
    }
    else {
      match.player2Score = parseInt(cleanValue);
    }
  }

  private openPlayerChangeDialog(isNewPlayer: boolean) {
    return this.dialog.open(PlayerSelectionDialogComponent, {
      data: {
        players: this.getPlayersToChange(),
        isNewPlayer: isNewPlayer
      }
    });
  }

  async addPlayerToGroup(group: Group) {
    this.openPlayerChangeDialog(true).afterClosed().subscribe(async (result: {player: Player, created: boolean}) => {
      if (!result || !result.player) return;
      if (result.player) {
        let finalPlayer = result.player;
        // If this is a new player, create it in the database
        if (result.created) {
          try {
            finalPlayer = await this.tournamentService.createPlayer(result.player.name);
          } catch (error) {
            console.error('Error creating new player:', error);
            return;
          }
        }
        
        // Add player to group
        group.players.push(finalPlayer);
        
        const participants = this.tournament()?.groups.flatMap(g => g.players);
        this.onGroupUpdate.emit({participants: participants ?? [], groupId: group.id, allMatches: this.tournamentService.createGroupMatches(group.players, group.id)});
        this.getAllGroupMatchesSorted();
      }
    });
  }

  changePlayer(group: Group, currentPlayer: Player) {
    this.openPlayerChangeDialog(false).afterClosed().subscribe((result: {player: Player, created: boolean}) => {
      if (result.player && result.player.id !== currentPlayer.id) {
        // Update player in group players array
        const playerIndex = group.players.findIndex(p => p.id === currentPlayer.id);
        if (playerIndex !== -1) {
          group.players[playerIndex] = result.player;
        }

        // Update player in matches
        group.matches.forEach(match => {
          if (match.player1.id === currentPlayer.id) {
            match.player1 = result.player;
          }
          if (match.player2.id === currentPlayer.id) {
            match.player2 = result.player;
          }
        });

        const participants = this.tournament()?.groups.flatMap(g => g.players);
        this.onGroupUpdate.emit({participants: participants ?? [], groupId: group.id, allMatches: []});
      }
    });
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
            return points + 1;
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

  getAllGroupMatchesSorted() {
    const tournament = this.tournament();
    if (!tournament) return;
    const allMatches: Match[] = [];
    const maxMatches = Math.max(
        ...tournament.groups.map((group) => group.matches.length)
    );

    for (let i = 0; i < maxMatches; i++) {
      tournament.groups.forEach((group) => {
        if (group.matches[i]) {
          allMatches.push(group.matches[i]);
        }
      });
    }

    this.allMatches.set(allMatches);
  }

  getPlayerGroupPosition(player: Player, groupId: number): string {
    const group = this.tournament()?.groups.find((g) => g.id === groupId);
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
    const tournament = this.tournament();
    return !tournament ? false : tournament.groups.every((group) =>
        group.matches.every((match) => match.completed)
    );
  }

  getPlayerPlace(group: Group, player: Player): number {
    const standings = group.players.map((p) => {
      const points = this.getPlayerPoints(group, p);
      const balance = this.getPlayerBalance(group, p);
      const legDifference = balance.scored - balance.conceded;
      
      return { 
        player: p, 
        points, 
        legDifference,
        scored: balance.scored,
        conceded: balance.conceded
      };
    });

    // Sort standings with correct priority order
    standings.sort((a, b) => {
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
        const headToHeadMatch = group.matches.find((m) =>
          m.completed &&
          ((m.player1.id === a.player.id && m.player2.id === b.player.id) ||
           (m.player2.id === a.player.id && m.player1.id === b.player.id))
        );

        if (headToHeadMatch) {
          // Determine who won the head-to-head match
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

    return standings.findIndex((s) => s.player.id === player.id) + 1;
  }

  private getHeadToHeadResult(
      group: Group,
      player: Player,
      playerPoints: number
  ): number {
    const matches = group.matches.filter(x => x.player1.id === player.id || x.player2.id === player.id);
    const match = group.matches.find(
        (m) => {
          if (m.player1.id === player.id) {
            return this.getPlayerPoints(group, m.player2) === playerPoints
          }
          else if (m.player2.id === player.id) {
            return this.getPlayerPoints(group, m.player1) === playerPoints
          }
          else return false;
        }

    );

    if (!match) return 0;

    if (match.player1.id === player.id) {
      return match.player1Score! > match.player2Score! ? 1 : -1;
    } else {
      return match.player2Score! > match.player1Score! ? 1 : -1;
    }
  }

  private getPlayersToChange() {
    if (this.tournament() && this.tournament()?.participants) {
      return this.availablePlayers().filter(
        player => !this.tournament()?.participants.some(rankedPlayer => rankedPlayer.id === player.id)
      );
    } else {
      return [];
    }
  }
}