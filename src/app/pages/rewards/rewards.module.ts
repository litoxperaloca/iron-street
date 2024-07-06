import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RewardsPageRoutingModule } from './rewards-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { RewardsPage } from './rewards.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RewardsPageRoutingModule,
    TranslateModule
  ],
  declarations: [RewardsPage]
})
export class RewardsPageModule { }
