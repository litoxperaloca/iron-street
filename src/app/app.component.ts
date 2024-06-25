import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { FirebaseService } from './services/firebase.service';
import { PreferencesService } from './services/preferences.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public languages: string[] = ['es', 'en', 'pt'];
  public language: string = this.languages[0];
  public appPages = [
    { title: 'Mapa, viajes, rutas, etc', url: '/home', icon: 'map' },
    { title: 'Configuración', url: '/conf', icon: 'options' }
  ];

  public userPages = [
    { title: 'Registrarse / Iniciar sesión', url: '/auth', icon: 'person' },
    { title: 'Suscripciones', url: '/subscribe', icon: 'ticket' },
    { title: 'Premios y recompensas', url: '/rewards', icon: 'trophy' }
  ];

  public infoPages = [
    { title: 'Novedades de Iron Street', url: '/blog', icon: 'newspaper' },
    { title: 'Tránsito y conducción segura', url: '/driving', icon: 'shield-checkmark' },
  ];

  public helpPages = [
    { title: 'Primera vez en Iron Street', url: '/welcome', icon: 'bulb' },
    { title: 'Preguntas frecuentes', url: '/help', icon: 'help' },
    { title: 'Contacto', url: '/contact', icon: 'chatbubble-ellipses' },
  ];

  public legalPages = [
    { title: 'Política de privacidad', url: '/privacy', icon: 'document-text' },
    { title: 'Términos y condiciones', url: '/tos', icon: 'document-text' },
  ];

  public allPages = [
    { title: 'Mapa, viajes, rutas...', url: '/home', icon: 'map' },
    { title: 'Registrarse / Login', url: '/auth', icon: 'person' },
    { title: 'Suscribite y ganá', url: '/subscribe', icon: 'ticket' },
    { title: 'Novedades', url: '/blog', icon: 'newspaper' },
    { title: 'Configuración', url: '/conf', icon: 'options' },
    { title: 'Premios y recompensas', url: '/rewards', icon: 'trophy' },
    { title: 'Sobre tránsito', url: '/driving', icon: 'shield-checkmark' },
    { title: 'Asistencia y tutoriales', url: '/help', icon: 'help' },
    { title: 'Ver intro nuevamente', url: '/welcome', icon: 'bulb' },

    { title: 'Política de privacidad', url: '/privacy', icon: 'document-text' },
    { title: 'Términos y condiciones', url: '/tos', icon: 'document-text' },
    { title: 'Contacto', url: '/contact', icon: 'chatbubble-ellipses' },
  ];
  constructor(
    private preferencesService: PreferencesService,
    public platform: Platform,
    private translate: TranslateService,
    private firebaseService: FirebaseService) {

    // Establece el idioma predeterminado
    this.platform.ready().then(async () => {
      this.firebaseService.startApp();
      //this.translate.addLangs(this.languages);
      await this.preferencesService.loadStoredTheme();
      await this.preferencesService.loadStoredLanguage();
      this.preferencesService.languageChanged.subscribe(lang => {
        this.language = lang;
        this.initializePages();

      })
      //this.initializePages();
      await this.preferencesService.getLanguage().then(lang => {
        this.language = lang;
        this.initializePages();

      });
    });
  }

  async toggleTheme() {
    await this.preferencesService.toggleTheme();
  }

  async changeLanguage(language: string) {
    await this.preferencesService.changeLanguageAndSavePref(language);
  }

  initializePages() {
    this.translate.get([
      'MAP_TRIPS_ROUTES',
      'SETTINGS',
      'REGISTER_LOGIN',
      'SUBSCRIPTIONS',
      'REWARDS',
      'NEWS',
      'SAFE_DRIVING',
      'FIRST_TIME',
      'FAQ',
      'CONTACT',
      'PRIVACY_POLICY',
      'TERMS_CONDITIONS'
    ]).subscribe(translations => {
      this.appPages = [
        { title: translations['MAP_TRIPS_ROUTES'], url: '/home', icon: 'map' },
        { title: translations['SETTINGS'], url: '/conf', icon: 'options' }
      ];

      this.userPages = [
        { title: translations['REGISTER_LOGIN'], url: '/auth', icon: 'person' },
        { title: translations['SUBSCRIPTIONS'], url: '/subscribe', icon: 'ticket' },
        { title: translations['REWARDS'], url: '/rewards', icon: 'trophy' }
      ];

      this.infoPages = [
        { title: translations['NEWS'], url: '/blog', icon: 'newspaper' },
        { title: translations['SAFE_DRIVING'], url: '/driving', icon: 'shield-checkmark' },
      ];

      this.helpPages = [
        { title: translations['FIRST_TIME'], url: '/welcome', icon: 'bulb' },
        { title: translations['FAQ'], url: '/help', icon: 'help' },
        { title: translations['CONTACT'], url: '/contact', icon: 'chatbubble-ellipses' },
      ];

      this.legalPages = [
        { title: translations['PRIVACY_POLICY'], url: '/privacy', icon: 'document-text' },
        { title: translations['TERMS_CONDITIONS'], url: '/tos', icon: 'document-text' },
      ];

      this.allPages = [
        { title: translations['MAP_TRIPS_ROUTES'], url: '/home', icon: 'map' },
        { title: translations['REGISTER_LOGIN'], url: '/auth', icon: 'person' },
        { title: translations['SUBSCRIPTIONS'], url: '/subscribe', icon: 'ticket' },
        { title: translations['NEWS'], url: '/blog', icon: 'newspaper' },
        { title: translations['SETTINGS'], url: '/conf', icon: 'options' },
        { title: translations['REWARDS'], url: '/rewards', icon: 'trophy' },
        { title: translations['SAFE_DRIVING'], url: '/driving', icon: 'shield-checkmark' },
        { title: translations['FAQ'], url: '/help', icon: 'help' },
        { title: translations['FIRST_TIME'], url: '/welcome', icon: 'bulb' },
        { title: translations['PRIVACY_POLICY'], url: '/privacy', icon: 'document-text' },
        { title: translations['TERMS_CONDITIONS'], url: '/tos', icon: 'document-text' },
        { title: translations['CONTACT'], url: '/contact', icon: 'chatbubble-ellipses' },
      ];
    });
  }
}
