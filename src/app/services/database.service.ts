import { Injectable } from '@angular/core';
import Database from 'better-sqlite3';
import { Tournament, PlayerRanking } from '../models/tournament.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('tournaments.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create tournaments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0
      )
    `);

    // Create player_rankings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS player_rankings (
        player_id INTEGER PRIMARY KEY,
        player_name TEXT NOT NULL,
        total_points INTEGER DEFAULT 0,
        rank_change INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async saveTournament(tournament: any) {
    const stmt = this.db.prepare(`
      INSERT INTO tournaments (id, name, date, data, completed)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tournament.id,
      tournament.name,
      tournament.date.toISOString(),
      JSON.stringify(tournament.data),
      tournament.completed ? 1 : 0
    );

    return result;
  }

  async getTournaments() {
    const stmt = this.db.prepare('SELECT * FROM tournaments ORDER BY date DESC');
    const tournaments = stmt.all();
    return tournaments.map(t => ({
      ...t,
      data: JSON.parse(t.data),
      completed: Boolean(t.completed)
    }));
  }

  async updatePlayerRankings(rankings: PlayerRanking[]) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO player_rankings 
      (player_id, player_name, total_points, rank_change, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const results = rankings.map(ranking => 
      stmt.run(
        ranking.player.id,
        ranking.player.name,
        ranking.totalPoints,
        ranking.rankChange
      )
    );

    return results;
  }

  async getPlayerRankings() {
    const stmt = this.db.prepare(`
      SELECT * FROM player_rankings 
      ORDER BY total_points DESC
    `);
    return stmt.all();
  }
}