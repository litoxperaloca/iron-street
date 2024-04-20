import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignupSigninPageRoutingModule } from './signup-signin-routing.module';

import { SignupSigninPage } from './signup-signin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignupSigninPageRoutingModule
  ],
  declarations: [SignupSigninPage]
})
export class SignupSigninPageModule { }
