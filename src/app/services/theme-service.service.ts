import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Set dark mode by default
  private theme: 'dark' | 'light' = 'dark';

  constructor() {
    //this.applyTheme();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  applyTheme(): void {
    if (this.theme === 'dark') {
      document.body.classList.add('dark');

      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.remove('dark-mode');

    }
  }
}
