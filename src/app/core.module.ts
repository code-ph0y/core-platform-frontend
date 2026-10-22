import { NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AuthenticationEffects } from './core/data/facades/authentication/effects/authentication.effects';
import { RouterEffects } from './core/data/facades/router/effects/router.effects';
import { ContainerManagerEffects } from './core/data/facades/container-manager/effects/container-manager.effects';

import { metaReducers, reducers } from './core/data/facades/index.facade';
import { AuthenticationFacade } from './core/data/facades/authentication/authentication.facade';
import { AlertService } from './core/data/services/alert/alert.service';
import { RouterFacade } from './core/data/facades/router/router.facade';

import { CustomRouterSerializer } from './core/data/facades/router/serializer/custom-router.serializer';
import { HttpErrorInterceptor } from './core/data/facades/authentication/interceptors/http-error.interceptors';
import { GlobalErrorHandler } from './core/data/facades/authentication/interceptors/global-error.interceptors';

import { environment } from '../environments/environment';
import { DataManagerEffects } from './core/data/facades/data-manager/effects/data-manager.effects';
import { AuthTokenInterceptor } from './core/data/facades/authentication/interceptors/auth-token.interceptor';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,

    // Register the root store with reducers and metaReducers
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
    }),

    // Register the global effects
    EffectsModule.forRoot([
      AuthenticationEffects,
      RouterEffects,
      DataManagerEffects,
      ContainerManagerEffects,
    ]),

    // Connect Angular Router with NgRx store
    StoreRouterConnectingModule.forRoot({
      stateKey: 'router', // Must match your router key in the reducers
      serializer: CustomRouterSerializer,
    }),

    // DevTools for debugging
    !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 25 }) : [],
  ],
  providers: [
    // Facades, services
    AuthenticationFacade,
    AlertService,
    RouterFacade,

    // Global error handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },

    // HTTP interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    // Prevent re-import of the core module
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}
