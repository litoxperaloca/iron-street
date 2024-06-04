import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TosPageRoutingModule } from './tos-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { TosPage } from './tos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TosPageRoutingModule,
    TranslateModule
  ],
  declarations: [TosPage]
})
export class TosPageModule { }
