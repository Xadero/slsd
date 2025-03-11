import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { TournamentViewComponent } from './app/components/tournament-view/tournament-view.component';
import { TournamentHistoryComponent } from './app/components/tournament-history/tournament-history.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <h1>Darts Tournament Manager</h1>
      <app-tournament-view></app-tournament-view>
      <app-tournament-history></app-tournament-history>
    </div>
  `,
  standalone: true,
  imports: [TournamentViewComponent, TournamentHistoryComponent]
})
export class App {}

bootstrapApplication(App);