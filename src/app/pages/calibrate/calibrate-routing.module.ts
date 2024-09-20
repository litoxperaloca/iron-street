import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CalibratePage } from './calibrate.page';

const routes: Routes = [
  {
    path: '',
    component: CalibratePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalibratePageRoutingModule {}
