import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfPage } from './conf.page';

const routes: Routes = [
  {
    path: '',
    component: ConfPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfPageRoutingModule {}
