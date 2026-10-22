import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkWithHref } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';

import { ContainerModule } from './ui-engine/containers/container-module';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    NgbModule,
    NgxSpinnerModule,
    RouterLink,
    RouterLinkWithHref,
    ContainerModule
  ],
  exports: [
  ]
})
export class SharedModule {}
