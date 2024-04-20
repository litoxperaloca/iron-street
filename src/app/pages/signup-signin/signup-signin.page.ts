import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
//import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup-signin',
  templateUrl: './signup-signin.page.html',
  styleUrls: ['./signup-signin.page.scss'],
})
export class SignupSigninPage {
  authAction: 'signin' | 'signup' = 'signin';
  email: string = "";
  password: string = "";
  confirmPassword: string = "";
  errorMessage: string = ''; // For displaying authentication errors

  constructor() { }

  async signInWithEmail(form: NgForm) {
    if (this.authAction === 'signin' && form.valid) {
      try {
        //await this.authService.SignIn(this.email, this.password);
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }

  async signUpWithEmail(form: NgForm) {
    if (this.authAction === 'signup' && form.valid && this.password === this.confirmPassword) {
      try {
        //await this.authService.SignUp(this.email, this.password);
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }

  async signInWithGoogle() {
    try {
      //await this.authService.GoogleAuth();
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async signInWithFacebook() {
    try {
      //await this.authService.FacebookAuth();
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  clearErrorMessage() {
    this.errorMessage = '';
  }
}
