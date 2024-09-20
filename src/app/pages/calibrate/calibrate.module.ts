import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CalibratePageRoutingModule } from './calibrate-routing.module';

import { CalibratePage } from './calibrate.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalibratePageRoutingModule
  ],
  declarations: [CalibratePage]
})
export class CalibratePageModule {}
