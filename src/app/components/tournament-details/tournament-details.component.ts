import {Component, input, OnInit, signal} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TournamentService } from "../../services/tournament.service";
import {
  Tournament,
  PlayerRanking,
  Player,
} from "../../models/tournament.model";
import { MatExpansionModule } from "@angular/material/expansion";
import { PlayerStatsComponent } from "../player-stats/player-stats.component";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-tournament-details",
  standalone: true,
  imports: [CommonModule, MatExpansionModule, PlayerStatsComponent, FormsModule],
  templateUrl: "./tournament-details.component.html",
  styleUrls: ["./tournament-details.component.scss"],
})
export class TournamentDetailsComponent implements OnInit {
  tournament = input.required<Tournament>();
  readonly panelOpenState = signal(false);
  private readonly EXTENDED_VIEW_KEY = 'tournament-extended-view';
  public extendedView: boolean = false;
  constructor(private tournamentService: TournamentService) {}

  ngOnInit() {
    const savedPreference = localStorage.getItem(this.EXTENDED_VIEW_KEY);
    this.extendedView = savedPreference === 'true';
  }

  getTournamentRankings(): Player[] {
    if (!this.tournament) return [];

    return [...this.tournament().participants].sort((a, b) => {
      const pointsA = this.getTournamentPoints(a);
      const pointsB = this.getTournamentPoints(b);
      const difference =  pointsB - pointsA;
      return difference !== 0 ? difference : this.getPlayerStats(b).legDifference - this.getPlayerStats(a).legDifference;
    });
  }

  getTournamentPoints(player: Player): number {
    if (!this.tournament()) return 0;

    let points = 0;
    
    if (this.tournament().completed && this.tournament().knockoutStageStarted) {
      const finalMatch = this.tournament().knockoutMatches.find(
        (m) => m.round === "Final" && m.completed
      );
      if (finalMatch) {
        if (
          (finalMatch.player1.id === player.id &&
            finalMatch.player1Score! > finalMatch.player2Score!) ||
          (finalMatch.player2.id === player.id &&
            finalMatch.player2Score! > finalMatch.player1Score!)
        ) {
          return 40;
        }

        if (
          finalMatch.player1.id === player.id ||
          finalMatch.player2.id === player.id
        ) {
          return 34;
        }
      }

      if (this.tournament() && this.tournament().knockoutStageStarted) {
        const thirdPlaceMatch = this.tournament().knockoutMatches.find(
          (m) => m.round === "Third-Place" && m.completed
        );
        if (thirdPlaceMatch) {
          if (
            (thirdPlaceMatch.player1.id === player.id &&
              thirdPlaceMatch.player1Score! > thirdPlaceMatch.player2Score!) ||
            (thirdPlaceMatch.player2.id === player.id &&
              thirdPlaceMatch.player2Score! > thirdPlaceMatch.player1Score!)
          ) {
            return 28;
          }

          if (
            thirdPlaceMatch.player1.id === player.id ||
            thirdPlaceMatch.player2.id === player.id
          ) {
            return 24;
          }
        }
      }

      const quarterFinalists = this.tournament().knockoutMatches
        .filter((m) => m.round === "Quarter-Finals" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (quarterFinalists.includes(player.id)) {
        return 20;
      }

      const roundOf16Players = this.tournament().knockoutMatches
        .filter((m) => m.round === "Round-16" && m.completed)
        .flatMap((m) => [m.player1.id, m.player2.id]);

      if (roundOf16Players.includes(player.id)) {
        return 14;
      }
    }

    this.tournament().groups.forEach((group) => {
      const standings = this.getGroupStandings(group);
      const playerPosition = standings.findIndex(
        (s) => s.player.id === player.id
      );


      if (this.tournament().groups.length === 8) {
        if (playerPosition === 2) {
          points = 8;
        } else if (playerPosition > 2) {
          points = 4;
        }
      }
      else {
        if (playerPosition === 2 || playerPosition === 3) {
          points = 14;
        } else if (playerPosition > 3) {
          points = 8;
        }
      }
    });

    return points;
  }

  getGroupStandings(group: any) {
    return this.tournamentService.getGroupStandings(group);
  }

  getMatchesByRound(round: string): any[] {
    return (
      this.tournament()?.knockoutMatches.filter((m) => m.round === round) || []
    );
  }

  isWinner(match: any, player: any): boolean {
    if (!match.completed) return false;
    if (match.player1.id === player.id) {
      return match.player1Score > match.player2Score;
    }
    return match.player2Score > match.player1Score;
  }

  getPlayerStats(player: Player) {
    if (!this.tournament)
      return {
        total180s: 0,
        total171s: 0,
        highestFinish: 0,
        bestLeg: 0,
        averageFinish: 0,
        legDifference: 0,
        matchesPlayed: 0,
        legsPlayed: 0,
        legsWon: 0,
        matchesWon: 0,
        wonLegsPercentage: 0,
        wonMatchesPercentage: 0,
      };

    let total180s = 0;
    let total171s = 0;
    let highestFinish = 0;
    let bestLeg = 0;
    let totalFinishes = 0;
    let finishCount = 0;
    let legsPlayed = 0;
    let legsWon = 0;
    let matchesPlayed = 0;
    let matchesWon = 0;

    // Calculate from group matches
    this.tournament().groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (!match.completed) return;

        if (match.player1.id === player.id) {
          matchesPlayed++;
          if (match.player1Score! > match.player2Score!) matchesWon++;

          if (match.player1Stats) {
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

          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player1Score!;
        }

        if (match.player2.id === player.id) {
          matchesPlayed++;
          if (match.player2Score! > match.player1Score!) matchesWon++;

          if (match.player2Stats) {
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

          legsPlayed += match.player1Score! + match.player2Score!;
          legsWon += match.player2Score!;
        }
      });
    });

    // Calculate from knockout matches
    this.tournament().knockoutMatches.forEach((match) => {
      if (!match.completed) return;

      if (match.player1.id === player.id) {
        matchesPlayed++;
        if (match.player1Score! > match.player2Score!) matchesWon++;

        if (match.player1Stats) {
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

        legsPlayed += match.player1Score! + match.player2Score!;
        legsWon += match.player1Score!;
      }

      if (match.player2.id === player.id) {
        matchesPlayed++;
        if (match.player2Score! > match.player1Score!) matchesWon++;

        if (match.player2Stats) {
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

        legsPlayed += match.player1Score! + match.player2Score!;
        legsWon += match.player2Score!;
      }
    });

    return {
      total180s,
      total171s,
      highestFinish,
      bestLeg,
      averageFinish: finishCount > 0 ? totalFinishes / finishCount : 0,
      legDifference: legsWon - (legsPlayed - legsWon),
      matchesPlayed,
      legsPlayed,
      legsWon,
      matchesWon,
      wonLegsPercentage: legsPlayed > 0 ? (legsWon / legsPlayed) * 100 : 0,
      wonMatchesPercentage:
        matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0,
    };
  }

  public translateRoundName(round: string): string {
    switch (round) {
      case "Round-16":
        return "1/8 finału";
      case "Quarter-Finals":
        return "Ćwierćfinały";
      case "Semi-Finals":
        return "Półfinały";
      case "Final":
        return "Finał";
      case "Third-Place":
        return "Mecz o 3. miejsce";
      default:
        return round;
    }
  }

  public getPlayersWithStats(): Player[] {
    return this.tournament().participants.filter(p => 
      this.getPlayerStats(p).total180s > 0 ||
      this.getPlayerStats(p).total171s > 0 ||
      this.getPlayerStats(p).highestFinish > 0 ||
      this.getPlayerStats(p).bestLeg > 0)
  }

    toggleExtendedView() {
    localStorage.setItem(this.EXTENDED_VIEW_KEY, this.extendedView.toString());
  }
}
