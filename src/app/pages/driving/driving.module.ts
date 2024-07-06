import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DrivingPageRoutingModule } from './driving-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { DrivingPage } from './driving.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DrivingPageRoutingModule,
    TranslateModule
  ],
  declarations: [DrivingPage]
})
export class DrivingPageModule { }
