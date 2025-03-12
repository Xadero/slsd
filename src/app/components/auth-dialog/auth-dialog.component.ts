import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-dialog">
      <h2>Authentication Required</h2>
      <p>Please sign in to create a tournament</p>

      <div class="auth-methods">
        <button class="btn github" (click)="signInWithGithub()">
          Sign in with GitHub
        </button>

        <div class="divider">or</div>

        <form (submit)="$event.preventDefault(); submitForm()" *ngIf="!isSignUp">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required>
          </div>
          <div class="buttons">
            <button type="submit" class="btn primary">Sign In</button>
            <button type="button" class="btn" (click)="isSignUp = true">Create Account</button>
          </div>
        </form>

        <form (submit)="$event.preventDefault(); submitForm()" *ngIf="isSignUp">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required>
          </div>
          <div class="buttons">
            <button type="submit" class="btn primary">Sign Up</button>
            <button type="button" class="btn" (click)="isSignUp = false">Back to Sign In</button>
          </div>
        </form>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .auth-dialog {
      padding: 20px;
      max-width: 400px;
      background: white;
      border-radius: 8px;
    }

    .auth-methods {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 20px;
    }

    .divider {
      text-align: center;
      color: #666;
      position: relative;
      margin: 20px 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 45%;
      height: 1px;
      background: #ddd;
    }

    .divider::before {
      left: 0;
    }

    .divider::after {
      right: 0;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #666;
    }

    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .buttons {
      display: flex;
      gap: 10px;
      justify-content: space-between;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn.primary {
      background: #007bff;
      color: white;
    }

    .btn.github {
      background: #24292e;
      color: white;
      width: 100%;
      padding: 10px;
    }

    .error {
      color: #dc3545;
      margin-top: 15px;
      text-align: center;
    }
  `]
})
export class AuthDialogComponent implements OnInit {
  email: string = '';
  password: string = '';
  isSignUp: boolean = false;
  error: string = '';

  ngOnInit(){
    console.log('dupa');
  }
  constructor(
    private authService: AuthService,
    private dialogRef: DialogRef<AuthDialogComponent>
  ) {}

  async submitForm() {
    try {
      if (this.isSignUp) {
        await this.authService.signUp(this.email, this.password);
      } else {
        await this.authService.signIn(this.email, this.password);
      }
      this.dialogRef.close();
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
    }
  }

  async signInWithGithub() {
    try {
      await this.authService.signInWithGithub();
      this.dialogRef.close();
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
    }
  }
}