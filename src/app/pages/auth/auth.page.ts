import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
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

  constructor(private authService: AuthService, private navCtrl: NavController) {
  }


  ngOnInit(): void {
    if (this.authService.getUser()) {
      this.navCtrl.navigateForward('/profile'); // Navigate to your home page
    }

  }

  async login() {
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.navCtrl.navigateForward('/profile'); // Navigate to your home page
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
      this.navCtrl.navigateForward('/profile'); // Navigate to your home page
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
      this.navCtrl.navigateForward('/profile'); // Navigate to your home page
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
      this.navCtrl.navigateForward('/profile'); // Navigate to your home page
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
