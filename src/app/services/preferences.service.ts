import { EventEmitter, Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './theme-service.service';
@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  languageChanged = new EventEmitter<string>();

  private readonly preferencesKey = 'user_preferences';
  defaultPreferences: {
    darkTheme: boolean,
    voiceInstructions: boolean,
    voice: string,
    voiceId: number,
    voiceSpeed: number,
    voiceVolume: number,
    voiceTone: number,
    language: string,
    mapStyle: string,
    distanceUnit: string
  } = {
      darkTheme: false,
      voiceInstructions: true,
      voice: '',
      voiceId: 0,
      voiceSpeed: 1,
      voiceVolume: 1,
      voiceTone: 1,
      language: 'es-ES',
      mapStyle: '3D atardecer',
      distanceUnit: 'km'
    };

  constructor(private translate: TranslateService, private themeService: ThemeService) {
  }


  async getPreferences(): Promise<{
    darkTheme: boolean,
    voiceInstructions: boolean,
    voice: string,
    voiceId: number,
    voiceSpeed: number,
    voiceVolume: number,
    voiceTone: number,
    language: string,
    mapStyle: string,
    distanceUnit: string
  }> {
    const { value } = await Storage.get({ key: this.preferencesKey });
    return value ? JSON.parse(value) : this.defaultPreferences;
  }

  async savePreferences(preferences: {
    darkTheme: boolean,
    voiceInstructions: boolean,
    voice: string,
    voiceId: number,
    voiceSpeed: number,
    voiceVolume: number,
    voiceTone: number,
    language: string,
    mapStyle: string,
    distanceUnit: string
  }) {
    await Storage.set({ key: this.preferencesKey, value: JSON.stringify(preferences) });
  }

  async loadStoredTheme() {
    const { value } = await Storage.get({ key: 'theme' });
    const theme = value || 'dark'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    if (theme === 'dark' || theme === 'light') {
      this.themeService.applyTheme(theme);
    }
  }

  async loadStoredLanguage() {
    const { value } = await Storage.get({ key: 'language' });
    const language = value || 'es'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    this.translate.setDefaultLang(language);
    this.translate.use(language);
  }

  async getLanguage(): Promise<string> {
    const { value } = await Storage.get({ key: 'language' });
    const language = value || 'es'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    return language;
  }

  async changeLanguage(lang: string) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    await Storage.set({ key: 'language', value: lang });
    this.languageChanged.emit(lang);
  }

  async changeLanguageAndSavePref(lang: string) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    await Storage.set({ key: 'language', value: lang });
    this.getPreferences().then(async (preferences) => {
      preferences.language = lang;
      await this.savePreferences(preferences);
      this.languageChanged.emit(lang);
    });
  }

  async changeTheme(darkMode: boolean) {
    let theme: 'dark' | 'light' = darkMode ? 'dark' : 'light';
    this.themeService.applyTheme(theme);
    await Storage.set({ key: 'theme', value: theme });
  }

  async toggleTheme() {
    const { value } = await Storage.get({ key: 'theme' });
    const theme = value || 'dark'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    if (theme === 'dark' || theme === 'light') {
      const invertTheme = theme === 'dark' ? 'light' : 'dark';
      this.themeService.applyTheme(invertTheme);
      await Storage.set({ key: 'theme', value: invertTheme });
      this.getPreferences().then(async (preferences) => {
        preferences.darkTheme = invertTheme === 'dark' ? true : false;
        await this.savePreferences(preferences);
      });
    }
  }
}
