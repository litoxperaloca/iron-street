import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TipsPageRoutingModule } from './tips-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { TipsPage } from './tips.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TipsPageRoutingModule,
    TranslateModule
  ],
  declarations: [TipsPage]
})
export class TipsPageModule { }
