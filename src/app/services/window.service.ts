import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowService {

  constructor() { }

  getValueFromProperty(key: string): any {
    return (window as any)[key];
  }

  setValueIntoProperty(key: string, value: any): void {
    (window as any)[key] = value;
  }
}
