import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Mapa', url: '/home/map', icon: 'map' },
    { title: 'Registrarse / Login', url: '/folder/signin', icon: 'paper-plane' },
    { title: 'Favoritos', url: '/folder/favorites', icon: 'heart' },
    { title: 'Historial', url: '/folder/history', icon: 'archive' },
    { title: 'Contacto', url: '/folder/contact', icon: 'trash' },
    { title: 'Preguntas frecuentes', url: '/folder/faq', icon: 'trash' },
    { title: 'Política de privacidad', url: '/folder/privacy', icon: 'trash' },
    { title: 'Términos y condiciones', url: '/folder/tos', icon: 'warning' },
    { title: 'Sobre Iron Street', url: '/folder/about', icon: 'warning' },

  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() { }
}
