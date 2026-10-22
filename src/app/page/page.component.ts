import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../core/data/facades/index.facade';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ContainerCreationService } from '../core/data/services/container-creation/container-creation.service';
import { selectPageDefinition } from '../core/data/facades/container-manager/selectors/container-manager.selectors';

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
  @ViewChild('container', { read: ViewContainerRef }) entry!: ViewContainerRef;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private containerCreation: ContainerCreationService,
  ) {}

  ngOnInit(): void {
    this.store
      .select(selectPageDefinition)
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe(async (schema) => {
        if (schema.container !== 'page' || !this.entry) return;

        this.entry.clear();

        const children = Array.isArray(schema.children) ? schema.children : [];
        for (const childDef of children) {
          if (!childDef) continue;
          await this.containerCreation.createChild(childDef, this.entry);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
