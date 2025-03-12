import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  private isAdmin = new BehaviorSubject<boolean>(false);

  constructor(private supabaseService: SupabaseService) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    this.currentUser.next(user);
    
    if (user) {
      const { data: roles } = await this.supabaseService.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      this.isAdmin.next(roles?.role === 'admin');
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  }

  async signInWithGithub(): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signInWithOAuth({
      provider: 'github'
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    if (error) throw error;
    this.currentUser.next(null);
    this.isAdmin.next(false);
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  isAdminUser(): Observable<boolean> {
    return this.isAdmin.asObservable();
  }
}