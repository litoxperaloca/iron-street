import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './theme-service.service';
import { ConfProperties } from '../models/conf-properties.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService implements OnInit{
  languageChanged = new EventEmitter<string>();
  confChanged = new EventEmitter<ConfProperties>();
  gpsChanged = new EventEmitter<any>();



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
      language: 'es',
      mapStyle: '3D atardecer',
      distanceUnit: 'km'
    };

    async setAudioStatus(audioStatus: boolean):Promise<void>{
      this.defaultPreferences.voiceInstructions=audioStatus;
      this.savePreferences(this.defaultPreferences);
    }

  constructor(private translate: TranslateService, private themeService: ThemeService) {
  }

  async ngOnInit(): Promise<void> {
    //this.defaultPreferences = await this.getPreferences();
  }

  async restoreSavedPreferences():Promise<void>{
    const preferences = await this.getPreferences();
    if(preferences.language!=this.defaultPreferences.language){
      await this.changeLanguage(preferences.language);
    }
    if(preferences.darkTheme!=this.defaultPreferences.darkTheme){
      await this.changeTheme(preferences.darkTheme);
    }
    this.defaultPreferences=preferences;
    
    this.defaultPreferences.voiceInstructions
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
    let { value } = await Preferences.get({ key: this.preferencesKey });

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
    await Preferences.set({ key: this.preferencesKey, value: JSON.stringify(preferences) });
  }

  async loadStoredTheme() {
    const { value } = await Preferences.get({ key: 'theme' });
    const theme = value || 'dark'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    if (theme === 'dark' || theme === 'light') {
      this.themeService.applyTheme(theme);
    }
  }

  async loadStoredLanguage() {
    let { value } = await Preferences.get({ key: 'language' });
    if(value && value.length>2){
      value=value.split("-")[0];
    }
    const language = value || 'es'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    this.translate.setDefaultLang(language);
    this.translate.use(language);
    this.languageChanged.emit(language);

  }

  async getLanguage(): Promise<string> {
    let { value } = await Preferences.get({ key: 'language' });
    if(value && value.length>2){
      value=value.split("-")[0];
    }
    const language = value || 'es'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    return language;
  }

  async changeLanguage(lang: string) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    await Preferences.set({ key: 'language', value: lang });
    this.languageChanged.emit(lang);
  }

  async changeLanguageAndSavePref(lang: string) {
    if(lang && lang.length>2){
      lang=lang.split("-")[0];
    }
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    await Preferences.set({ key: 'language', value: lang });
    this.getPreferences().then(async (preferences) => {
      preferences.language = lang;
      await this.savePreferences(preferences);
      this.languageChanged.emit(lang);
    });
  }

  async changeTheme(darkMode: boolean) {
    let theme: 'dark' | 'light' = darkMode ? 'dark' : 'light';
    this.themeService.applyTheme(theme);
    await Preferences.set({ key: 'theme', value: theme });
  }

  async toggleTheme() {
    const { value } = await Preferences.get({ key: 'theme' });
    const theme = value || 'dark'; // Usa 'es' como idioma predeterminado si no hay valor almacenado
    if (theme === 'dark' || theme === 'light') {
      const invertTheme = theme === 'dark' ? 'light' : 'dark';
      this.themeService.applyTheme(invertTheme);
      await Preferences.set({ key: 'theme', value: invertTheme });
      this.getPreferences().then(async (preferences) => {
        preferences.darkTheme = invertTheme === 'dark' ? true : false;
        await this.savePreferences(preferences);
      });
    }
  }


 // Actualización de los métodos para GPS Settings, Snap Service y Traffic Alert
  async getGpsSettings(): Promise<any> {
    const { value } = await Preferences.get({ key: 'gpsSettings' });
    return value ? JSON.parse(value) : environment.gpsSettings;  // Devolver valor guardado o el valor por defecto del environment
  }

  async setGpsSettings(settings: any): Promise<void> {
    await Preferences.set({ key: 'gpsSettings', value: JSON.stringify(settings) });
    environment.gpsSettings = settings;
    //console.log(environment);
    //console.log('gpsSettings Service Config actualizados en environment:', environment.gpsSettings);
    this.gpsChanged.emit(settings);
  }

  async getSnapServiceConf(): Promise<any> {
    const { value } = await Preferences.get({ key: 'snapServiceConf' });
    return value ? JSON.parse(value) : environment.snapServiceConf;  // Devolver valor guardado o el valor por defecto del environment
  }

  async setSnapServiceConf(conf: any): Promise<void> {
    await Preferences.set({ key: 'snapServiceConf', value: JSON.stringify(conf) });
    environment.snapServiceConf = conf;
    //console.log(environment);
    //console.log('Snap Service Config actualizados en environment:', environment.snapServiceConf);
    this.gpsChanged.emit(conf);
  }

  async getTrafficAlertServiceConf(): Promise<any> {
    const { value } = await Preferences.get({ key: 'trafficAlertServiceConf' });
    return value ? JSON.parse(value) : environment.trafficAlertServiceConf;  // Devolver valor guardado o el valor por defecto del environment
  }

  async setTrafficAlertServiceConf(conf: any): Promise<void> {
    await Preferences.set({ key: 'trafficAlertServiceConf', value: JSON.stringify(conf) });
    environment.trafficAlertServiceConf = { ...conf };
    //console.log('Settings Service Config actualizados en environment:', environment.trafficAlertServiceConf);

  }
  
}
