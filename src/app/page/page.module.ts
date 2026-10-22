import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageComponent} from './page.component';
import {PageRoutingModule} from "./page-routing.module";

@NgModule({
  declarations: [
    PageComponent
  ],
  imports: [
    CommonModule,
    PageRoutingModule
  ],
  exports: [PageComponent]
})
export class PageModule {
}
