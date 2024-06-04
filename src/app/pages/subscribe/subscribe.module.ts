import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubscribePageRoutingModule } from './subscribe-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { SubscribePage } from './subscribe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubscribePageRoutingModule,
    TranslateModule
  ],
  declarations: [SubscribePage]
})
export class SubscribePageModule { }
