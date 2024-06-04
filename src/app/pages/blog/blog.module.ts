import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BlogPageRoutingModule } from './blog-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { BlogPage } from './blog.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BlogPageRoutingModule,
    TranslateModule
  ],
  declarations: [BlogPage]
})
export class BlogPageModule { }
