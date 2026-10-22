import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  public errorMessages: any[] = [];
  public errors: any = {};

  constructor() { }

  addErrorMessage(message: any, errors : any) {
    this.clear();
    this.errorMessages.push(message);
    this.errors = errors;
  }

  clear() {
    this.errorMessages = [];
    this.errors = {};
  }
}
