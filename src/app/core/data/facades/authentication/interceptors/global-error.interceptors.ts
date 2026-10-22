import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert/alert.service';
import { Injectable, NgZone, ErrorHandler } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private router: Router,
    private zone: NgZone,
    private alertService: AlertService
  ) {}

  handleError(error: any): void {
    // Log the error with the fatal level
    console.error(error);
    // Optionally, show a global alert or route somewhere
    // this.alertService.error('An unexpected error occurred');
    // this.router.navigate(['/error-page']);
  }
}
