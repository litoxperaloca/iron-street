import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfPageRoutingModule } from './conf-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { ConfPage } from './conf.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfPageRoutingModule,
    TranslateModule
  ],
  declarations: [ConfPage]
})
export class ConfPageModule { }
