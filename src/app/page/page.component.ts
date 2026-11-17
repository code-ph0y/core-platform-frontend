import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import { Store } from '@ngrx/store';
import { AppState } from '../core/data/facades/index.facade';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ContainerCreationService } from '../core/data/services/container-creation/container-creation.service';

import {
  selectPageDefinition
} from '../core/data/facades/container-manager/selectors/container-manager.selectors';

export interface ContainerComponentInterface {
  container?: any;
  attributes?: any;
  data?: any;
  children?: ContainerComponentInterface[];
}

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  standalone: false
})
export class PageComponent implements OnInit, OnDestroy {
  @ViewChild('container', {
    read: ViewContainerRef,
    static: true
  })
  entry!: ViewContainerRef;

  private readonly destroy$ = new Subject<void>();
  private renderVersion = 0;

  constructor(
    private store: Store<AppState>,
    private containerCreation: ContainerCreationService
  ) {}

  ngOnInit(): void {
    this.store
      .select(selectPageDefinition)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async schema => {
        const version = ++this.renderVersion;

        // Always remove the previous page, including
        // when the page definition becomes null.
        this.entry.clear();

        if (!schema || schema.container !== 'page') {
          return;
        }

        const children = Array.isArray(schema.children)
          ? schema.children
          : [];

        for (const childDef of children) {
          if (version !== this.renderVersion) {
            return;
          }

          if (!childDef) {
            continue;
          }

          const componentRef =
            await this.containerCreation.createChild(
              childDef,
              this.entry
            );

          // Prevent an older asynchronous render from
          // leaving components behind after a page change.
          if (version !== this.renderVersion) {
            componentRef?.destroy();
            return;
          }
        }
      });
  }

  ngOnDestroy(): void {
    ++this.renderVersion;

    this.destroy$.next();
    this.destroy$.complete();
  }
}
