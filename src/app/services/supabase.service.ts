import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Tournament, PlayerRanking } from '../models/tournament.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        }
      }
    );
  }

  async saveTournament(tournament: {
    name: string;
    date: Date;
    data: any;
    completed: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('tournaments')
      .insert([{
        name: tournament.name,
        date: tournament.date.toISOString(),
        data: tournament.data,
        completed: tournament.completed
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async getTournaments() {
    const { data, error } = await this.supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updatePlayerRankings(rankings: PlayerRanking[]) {
    const { data, error } = await this.supabase
      .from('player_rankings')
      .upsert(
        rankings.map(ranking => ({
          player_id: ranking.player.id,
          player_name: ranking.player.name,
          total_points: ranking.totalPoints,
          rank_change: ranking.rankChange,
          tournament_points: ranking.tournamentPoints,
          total_180s: ranking.total180s,
          total_171s: ranking.total171s,
          highest_finish: ranking.highestFinish,
          best_leg: ranking.bestLeg,
          leg_difference: ranking.legDifference,
          matches_played: ranking.matchesPlayed,
          legs_played: ranking.legsPlayed,
          legs_won: ranking.legsWon,
          matches_won: ranking.matchesWon
        }))
      )
      .select();

    if (error) throw error;
    return data;
  }

  async getPlayerRankings() {
    const { data, error } = await this.supabase
      .from('player_rankings')
      .select('*')
      .order('total_points', { ascending: false });

    if (error) throw error;
    return data;
  }
}