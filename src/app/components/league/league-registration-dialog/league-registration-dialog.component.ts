import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { SupabaseService } from '../../../services/supabase.service';
import { LeagueService } from '../../../services/league.service';

@Component({
  selector: 'app-league-registration-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './league-registration-dialog.component.html',
  styleUrls: ['./league-registration-dialog.component.scss'],
})
export class LeagueRegistrationDialogComponent {
  formData = {
    name: '',
    surname: '',
    phoneNumber: '',
    city: ''
  };

  isSubmitting = false;
  phoneError = '';
  successMessage = '';

  constructor(
    private dialogRef: DialogRef<LeagueRegistrationDialogComponent>,
    private leagueService: LeagueService
  ) {}

  formatPhoneNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    
    // Format as XXX-XXX-XXX
    if (value.length >= 6) {
      value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
    } else if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    
    input.value = value;
    this.formData.phoneNumber = value;
    this.phoneError = '';
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.isSubmitting = true;
    this.phoneError = '';

    try {
      const { data: existingRegistration } = await this.leagueService.checkIfPlayerIsRegistered(this.formData.phoneNumber);

      if (existingRegistration) {
        this.phoneError = 'Ten numer telefonu jest już zarejestrowany w lidze';
        this.isSubmitting = false;
        return;
      }

      const { error } = await this.leagueService.registerNewPlayerToLeague(this.formData);

      if (error) {
        throw error;
      }

      this.successMessage = 'Rejestracja przebiegła pomyślnie!';
      
      setTimeout(() => {
        this.dialogRef.close();
      }, 2000);

    } catch (error: any) {
      this.phoneError = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
    } finally {
      this.isSubmitting = false;
    }
  }

  close() {
    this.dialogRef.close();
  }
}