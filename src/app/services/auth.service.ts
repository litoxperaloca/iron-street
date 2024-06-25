// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { FacebookAuthProvider, GoogleAuthProvider, User, UserCredential, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: User | null = null;

  constructor(private fs: FirebaseService) {
    if (this.fs.auth) {
      onAuthStateChanged(this.fs.auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/auth.user
          this.user = user;
          // ...
        } else {
          this.user = null;

          // User is signed out
          // ...
        }
      });
    }
  }

  // Email/Password Sign Up
  async signUp(email: string, password: string): Promise<UserCredential | null> {
    if (this.fs.auth) {
      return await createUserWithEmailAndPassword(this.fs.auth, email, password);
    }
    return null;
  }

  // Email/Password Login
  async login(email: string, password: string): Promise<UserCredential | null> {
    if (this.fs.auth) {
      return await signInWithEmailAndPassword(this.fs.auth, email, password);
    }
    return null;
  }

  // Google Login
  async googleLogin(): Promise<UserCredential | null> {
    if (this.fs.auth) {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(this.fs.auth, provider);
    }
    return null;
  }

  // Facebook Login
  async facebookLogin(): Promise<UserCredential | null> {
    if (this.fs.auth) {
      const provider = new FacebookAuthProvider();
      return await signInWithPopup(this.fs.auth, provider);
    }
    return null;
  }


  async logout(): Promise<void> {
    if (this.fs.auth) return await signOut(this.fs.auth);
  }

  getUser(): User | null {
    return this.user;
  }

  async updateUserInfo(userInfo: any): Promise<void> {

  }
}
