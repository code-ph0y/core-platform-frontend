import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private data =  new BehaviorSubject<any>({});

  currentData = this.data.asObservable();

  constructor() { }

  // setData(field, data) {
  //   const currentValue = this.data.value;
  //   currentValue[field] = data;
  //   this.data.next(currentValue);
  // }
}
