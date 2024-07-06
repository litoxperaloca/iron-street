// voice.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {

  constructor() { }

  /**
   * Utiliza la Web Speech API para reproducir un mensaje de texto como audio.
   * @param message El mensaje de texto a reproducir.
   */
  speak(message: string): void {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'es-ES'; // Ajusta esto según el idioma de tu aplicación.
      window.speechSynthesis.speak(speech);
    } else {
      console.error('La Web Speech API no está soportada en este navegador.');
    }
  }
}
