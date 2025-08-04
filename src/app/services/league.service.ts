import { Injectable } from "@angular/core";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class LeagueService {
    constructor(private supabaseService: SupabaseService) {
        
    }

    public async checkIfPlayerIsRegistered(phoneNumber: string) {
        return await this.supabaseService.supabase
        .from('league_registrations')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();
    }

    public async registerNewPlayerToLeague(formData: {name: string, surname: string, phoneNumber: string, city: string}) {
      return await this.supabaseService.supabase
        .from('league_registrations')
        .insert([{
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          phone_number: formData.phoneNumber,
          city: formData.city.trim(),
        }]);
    }
}