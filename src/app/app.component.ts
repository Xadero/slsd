import { Component } from "@angular/core";
import { TournamentViewComponent } from "./components/tournament-view/tournament-view.component";
import { TournamentHistoryComponent } from "./components/tournament-history/tournament-history.component";

@Component({
  selector: "app-root",
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>Darts Tournament Manager</h1>
        </div>
        <nav class="navigation">
          <a href="#" class="nav-link">Tournaments</a>
          <a href="#" class="nav-link">Championships</a>
          <a href="#" class="nav-link">Dart Academy</a>
          <a href="#" class="nav-link">Snipers</a>
          <a href="#" class="nav-link">Contact</a>
          <a href="#" class="nav-link highlight">Become a Partner</a>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <div class="app-container">
        <app-tournament-view></app-tournament-view>
        <app-tournament-history></app-tournament-history>
      </div>
    </main>
  `,
  styles: [
    `
      .header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #1a1a2e;
        color: white;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 1000;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo h1 {
        margin: 0;
        font-size: 1.5rem;
        color: white;
      }

      .navigation {
        display: flex;
        gap: 1.5rem;
        align-items: center;
      }

      .nav-link {
        color: white;
        text-decoration: none;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .nav-link.highlight {
        background: #e63946;
        color: white;
      }

      .nav-link.highlight:hover {
        background: #dc2f3c;
      }

      .main-content {
        margin-top: 80px;
        min-height: calc(100vh - 80px);
        background: #f5f5f5;
      }

      .app-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
    `,
  ],
  standalone: true,
  imports: [TournamentViewComponent, TournamentHistoryComponent],
})
export class AppComponent {}
