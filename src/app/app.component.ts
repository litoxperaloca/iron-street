import { Component } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { ThemeService } from './services/theme-service.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public appPages = [
    { title: 'Iron Street V0.3', url: '/about', icon: 'information' },
    { title: 'Mapa, viajes, rutas...', url: '/home', icon: 'map' },
    { title: 'Registrarse / Login', url: '/auth', icon: 'person' },
    { title: 'Suscribite y ganá', url: '/subscribe', icon: 'ticket' },
    { title: 'Novedades', url: '/blog', icon: 'newspaper' },
    { title: 'Configuración', url: '/conf', icon: 'options' },
    { title: 'Premios y recompensas', url: '/rewards', icon: 'trophy' },
    { title: 'Sobre tránsito', url: '/driving', icon: 'shield-checkmark' },
    { title: 'Asistencia y tutoriales', url: '/help', icon: 'help' },
    { title: 'Política de privacidad', url: '/privacy', icon: 'document-text' },
    { title: 'Términos y condiciones', url: '/tos', icon: 'document-text' },
    { title: 'Contacto', url: '/contact', icon: 'chatbubble-ellipses' },
    /*{ title: 'TEST: COMO ANTES', url: '/test', icon: 'warning' },*/
  ];

  constructor(public authenticator: AuthenticatorService, private themeService: ThemeService) { this.themeService.applyTheme(); }
}
