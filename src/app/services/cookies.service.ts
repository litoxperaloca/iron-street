import { Injectable } from '@angular/core';
import { CapacitorCookies } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class CookiesService {

  constructor() { }

  getCookie(){
    return document.cookie;
  };

  setCookie(key:string, value:string){
    document.cookie = key + '=' + value;
  };

  setCapacitorCookie = async () => {
    await CapacitorCookies.setCookie({
      url: 'http://example.com',
      key: 'language',
      value: 'en',
    });
  };

  deleteCookie = async () => {
    await CapacitorCookies.deleteCookie({
      url: 'https://example.com',
      key: 'language',
    });
  };

  clearCookiesOnUrl = async () => {
    await CapacitorCookies.clearCookies({
      url: 'https://example.com',
    });
  };

  clearAllCookies = async () => {
    await CapacitorCookies.clearAllCookies();
  };
}
