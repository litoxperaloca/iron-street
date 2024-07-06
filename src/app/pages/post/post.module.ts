import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PostPageRoutingModule } from './post-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { PostPage } from './post.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PostPageRoutingModule,
    TranslateModule
  ],
  declarations: [PostPage]
})
export class PostPageModule { }
