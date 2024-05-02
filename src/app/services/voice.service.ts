import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private speakerStatus: boolean = true; // Usamos un booleano para el estado del altavoz

  constructor() { }

  async speak(text: string): Promise<void> {
    if (!this.speakerStatus) return;
    await TextToSpeech.speak({
      text,
      lang: 'es-ES', // Define el idioma aquí o usa una variable si necesitas cambiarlo
      //rate: 1.1, // Define la velocidad de la voz
      //pitch: 1.1, // Define el tono de la voz
      // volume: 1.0, // Define el volumen
      category: 'playback', // Define la categoría, 'ambient' es útil para apps de navegación
    });
  }

  toggleSpeaker(): boolean {
    this.speakerStatus = !this.speakerStatus;
    return this.speakerStatus;
  }

  getSpeakerStatus(): string {
    return this.speakerStatus ? "On" : "Off";
  }

  isSpeakerOn(): boolean {
    return this.speakerStatus;
  }

  // Implementa las demás funciones aquí como necesites
}
