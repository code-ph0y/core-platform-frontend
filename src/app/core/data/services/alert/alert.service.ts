import { Injectable, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  alerts: any[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.alerts.push({ textOrTpl, ...options });
  }

  remove(alert: any) {
    this.alerts = this.alerts.filter(t => t !== alert);
  }

  success(textOrTpl: string, options: any = {})
  {
    options.classname = 'bg-success text-light';
    options.type = 'success';
    this.alerts.push({ textOrTpl, ...options });
  }

  error(textOrTpl: string, options: any = {})
  {
    options.classname = 'bg-danger text-light';
    options.type = 'error';
    this.alerts.push({ textOrTpl, ...options });
  }

  clear() {
    this.alerts.splice(0, this.alerts.length);
  }
}
