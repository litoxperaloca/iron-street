import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Set dark mode by default
  private theme: 'dark' | 'light' = 'dark';
  //APPEARENCE CONFIG
  isDarkMode: boolean = true;
  isLightMode: boolean = false;
  isAutoMode: boolean = false;
  highContrast: boolean = false;
  fontSize: 'small' | 'medium' | 'large' = 'medium';
  backgroundColor: string = "#000000";

  constructor() {
    //this.applyTheme();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.theme);
  }

  applyTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
    if (this.theme === 'dark') {
      document.body.classList.remove('light');
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light');
      document.body.classList.add('light-mode');
    }
  }

  toggleHighContrast(highContrastEnabled: boolean): void {
  }

  changeFontSize(fontSize: string): void {
  }

  changeBackgroundColor(backgroundColor: string): void {
  }
}
