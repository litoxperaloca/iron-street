import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthPageRoutingModule } from './auth-routing.module';
import { AuthPage } from './auth.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    TranslateModule,
    AmplifyAuthenticatorModule

  ],
  declarations: [AuthPage]
})
export class AuthPageModule { }
