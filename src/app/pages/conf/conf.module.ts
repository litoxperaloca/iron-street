import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfPageRoutingModule } from './conf-routing.module';

import { ConfPage } from './conf.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfPageRoutingModule
  ],
  declarations: [ConfPage]
})
export class ConfPageModule {}
