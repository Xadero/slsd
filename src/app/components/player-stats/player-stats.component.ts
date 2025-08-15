import { Component, input } from '@angular/core';
import { MatchStatistics } from '../../models/tournament.model';

@Component({
  selector: 'app-player-stats',
  imports: [],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss'
})
export class PlayerStatsComponent {
  playerStats = input.required<MatchStatistics>();
}
