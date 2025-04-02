import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import {
  Tournament,
  PlayerRanking,
  TournamentSeries,
  Player,
} from "../models/tournament.model";

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: localStorage
        },
        db: {
          schema: "public",
        },
      }
    );
  }

  async saveTournament(tournament: {
    name: string;
    date: Date;
    data: any;
    completed: boolean;
    series_id?: string;
  }) {
    // First check if tournament exists
    const { data: existingTournament } = await this.supabase
      .from("tournaments")
      .select("id")
      .eq("name", tournament.name)
      .eq("date", tournament.date.toISOString())
      .single();

    if (existingTournament) {
      // Update existing tournament
      const { data, error } = await this.supabase
        .from("tournaments")
        .update({
          data: tournament.data,
          completed: tournament.completed,
          series_id: tournament.series_id,
        })
        .eq("id", existingTournament.id)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Insert new tournament
      const { data, error } = await this.supabase
        .from("tournaments")
        .insert([{
          name: tournament.name,
          date: tournament.date.toISOString(),
          data: tournament.data,
          completed: tournament.completed,
          series_id: tournament.series_id,
        }])
        .select();

      if (error) throw error;
      return data;
    }
  }

  async getTournaments() {
    const { data, error } = await this.supabase
      .from("tournaments")
      .select(
        `
        *,
        tournament_series (
          name
        )
      `
      )
      .order("date", { ascending: false });

    if (error) throw error;
    return data.map((t) => ({
      ...t,
      series_name: t.tournament_series?.name,
    }));
  }

  async getTournamentSeries() {
    const { data, error } = await this.supabase
      .from("tournament_series")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async createTournamentSeries(name: string) {
    const { data, error } = await this.supabase
      .from("tournament_series")
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createPlayer(player: { name: string }): Promise<Player> {
    const { data, error } = await this.supabase
      .from("player_rankings")
      .insert([{
        player_id: Date.now(),
        player_name: player.name,
        total_points: 0,
        rank_change: 0,
        tournament_points: [],
        total_180s: 0,
        total_171s: 0,
        highest_finish: 0,
        best_leg: 0,
        leg_difference: 0,
        matches_played: 0,
        legs_played: 0,
        legs_won: 0,
        matches_won: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.player_id,
      name: data.player_name,
      totalPoints: data.total_points
    };
  }

  async getPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from("player_rankings")
      .select("*")
      .order("player_name");

    if (error) throw error;
    return data.map(p => ({
      id: p.player_id,
      name: p.player_name,
      totalPoints: p.total_points
    }));
  }

  async updatePlayerRankings(rankings: PlayerRanking[]) {
    const { data, error } = await this.supabase
      .from("player_rankings")
      .upsert(
        rankings.map((ranking) => ({
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
          matches_won: ranking.matchesWon,
        }))
      )
      .select();

    if (error) throw error;
    return data;
  }

  async getPlayerRankings() {
    const { data, error } = await this.supabase
      .from("player_rankings")
      .select("*")
      .order("total_points", { ascending: false });

    if (error) throw error;
    return data;
  }
}