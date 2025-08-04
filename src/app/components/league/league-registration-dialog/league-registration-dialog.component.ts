import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { SupabaseService } from '../../../services/supabase.service';

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
    phoneNumber: ''
  };

  isSubmitting = false;
  phoneError = '';
  successMessage = '';

  constructor(
    private dialogRef: DialogRef<LeagueRegistrationDialogComponent>,
    private supabaseService: SupabaseService
  ) {}

  formatPhoneNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 9 digits
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
    this.phoneError = ''; // Clear error when user types
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.isSubmitting = true;
    this.phoneError = '';

    try {
      // Check if phone number already exists
      const { data: existingRegistration } = await this.supabaseService.supabase
        .from('league_registrations')
        .select('id')
        .eq('phone_number', this.formData.phoneNumber)
        .single();

      if (existingRegistration) {
        this.phoneError = 'Ten numer telefonu jest już zarejestrowany w lidze';
        this.isSubmitting = false;
        return;
      }

      // Register new user
      const { error } = await this.supabaseService.supabase
        .from('league_registrations')
        .insert([{
          name: this.formData.name.trim(),
          surname: this.formData.surname.trim(),
          phone_number: this.formData.phoneNumber
        }]);

      if (error) {
        throw error;
      }

      this.successMessage = 'Rejestracja przebiegła pomyślnie!';
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        this.dialogRef.close();
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      this.phoneError = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
    } finally {
      this.isSubmitting = false;
    }
  }

  close() {
    this.dialogRef.close();
  }
}