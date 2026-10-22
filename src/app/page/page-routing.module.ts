import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageComponent } from './page.component';
import { AuthGuard } from "../core/utils/helpers/auth.guard";

const routes: Routes = [
  {
    path: 'authenticate/login',
    component: PageComponent
  },
  {
    path: ':resource',
    component: PageComponent,
    canActivate: [AuthGuard],
    data: { defaultType: 'default', defaultVersion: 'default' }
  },
  {
    path: ':resource/:type',
    component: PageComponent,
    canActivate: [AuthGuard],
    data: { defaultVersion: 'default' }
  },
  {
    path: ':resource/:type/:version',
    component: PageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    component: PageComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule { }
