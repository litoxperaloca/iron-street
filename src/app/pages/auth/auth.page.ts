import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FirebaseService } from 'src/app/services/firebase.service';
@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  email!: string;
  password!: string;
  confirmPassword!: string;
  errorMessage!: string;
  loading = false;
  authSegment = 'login';
  agreedToTerms = false;

  constructor(private firebaseService:FirebaseService, private authService: AuthService, private router: Router) {
    this.firebaseService.startApp();

  }


  ngOnInit(): void {
    if (this.authService.getUser()) {
      this.router.navigateByUrl('/profile', { replaceUrl: true });
    }

  }

  async login() {
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/profile', { replaceUrl: true });
    } catch (err) {
      this.handleAuthError(err);
    } finally {
      this.loading = false;
    }
  }

  async signUp() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;
    try {
      await this.authService.signUp(this.email, this.password);
      this.router.navigateByUrl('/profile', { replaceUrl: true });
    } catch (err) {
      this.handleAuthError(err);
    } finally {
      this.loading = false;
    }
  }

  async googleLogin() {
    this.loading = true;
    try {
      await this.authService.googleLogin();
      this.router.navigateByUrl('/profile', { replaceUrl: true });
    } catch (err) {
      this.handleAuthError(err);
    } finally {
      this.loading = false;
    }
  }

  async facebookLogin() {
    this.loading = true;
    try {
      await this.authService.facebookLogin();
      this.router.navigateByUrl('/profile', { replaceUrl: true });
    } catch (err) {
      this.handleAuthError(err);
    } finally {
      this.loading = false;
    }
  }

  handleAuthError(err: any) {
    if (err.code === 'auth/cancelled-popup-request') {
      this.errorMessage = 'Multiple authentication popups detected. Please try again.';
    } else {
      this.errorMessage = 'Authentication failed: ' + err.message;
    }
  }
}
