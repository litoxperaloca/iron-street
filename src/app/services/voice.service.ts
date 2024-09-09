import { EventEmitter, Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { PreferencesService } from './preferences.service';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  speakerStatus: boolean = true; // Usamos un booleano para el estado del altavoz
  voiceId: number = 0;
  lang: string = 'es-ES';
  rate: number = 1.3;
  pitch: number = 0.7;
  volume: number = 1;
  category: string = 'playback';
  voices: SpeechSynthesisVoice[] = [];
  isSpeaking: boolean = false;
  speechQueue: string[] = [];
  audioStatusChanged = new EventEmitter<boolean>();


  constructor(private preferencesService: PreferencesService) {
    this.speakerStatus = this.preferencesService.defaultPreferences.voiceInstructions;
    if (this.voices.length === 0) {
      this.getSupportedVoices().then((voices) => {
        this.voices = voices.voices;
      });
    }
  }

  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voices.length === 0) {
      await this.getSupportedVoices().then((voices) => {
        this.voices = voices.voices;
      }
      );
    }
    return this.voices;
  }

  selectLang(lang: string) {
    this.lang = lang;
  }

  async speakWithOptions(options: any): Promise<void> {
    if (!this.speakerStatus) return;
    return await TextToSpeech.speak({
      text: options.text,
      lang: options.lang, // Define el idioma aquí o usa una variable si necesitas cambiarlo
      rate: options.rate, // Define la velocidad de la voz
      pitch: options.pitch, // Define el tono de la voz
      volume: options.volume, // Define el volumen
      category: options.category, // Define la categoría, 'ambient' es útil para apps de navegación
      voice: options.voice
    }).then(() => {

    }).catch((error) => {
    }).finally(() => {
      //this.speakerStatus = false;
    });

  }

  selectVoiceById(id: number): void {
    this.voiceId = id;
  }


  async speak_legacy(text: string): Promise<void> {
    if (!this.speakerStatus) return;
    await TextToSpeech.speak({
      text,
      lang: 'es-ES', // Define el idioma aquí o usa una variable si necesitas cambiarlo
      //rate: 1.1, // Define la velocidad de la voz
      //pitch: 1.1, // Define el tono de la voz
      // volume: 1.0, // Define el volumen
      category: 'playback', // Define la categoría, 'ambient' es útil para apps de navegación
      voice: 2
    }).then(() => {

    }).catch((error) => {
    }).finally(() => {
      //this.speakerStatus = false;
    });
  }

  async speakWithVoice(text: string, voice: number): Promise<void> {
    if (!this.speakerStatus) return;
    await TextToSpeech.speak({
      text,
      lang: 'es-ES', // Define el idioma aquí o usa una variable si necesitas cambiarlo
      rate: 1.0, // Define la velocidad de la voz
      pitch: 0.5, // Define el tono de la voz
      volume: 1.0, // Define el volumen
      category: 'ambient', // Define la categoría, 'ambient' es útil para apps de navegación
      voice: voice
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

  async getSupportedVoices(): Promise<{ voices: SpeechSynthesisVoice[] }> {
    return TextToSpeech.getSupportedVoices();
  }

  async conf() {
    this.preferencesService.getPreferences().then((preferences) => {
      this.voiceId = preferences.voiceId;
      this.volume = preferences.voiceVolume;
      this.pitch = preferences.voiceTone;
      this.rate = preferences.voiceSpeed;
      this.lang = preferences.language;
      this.speakerStatus = preferences.voiceInstructions;
    });

  }

  async speak(text: string): Promise<void> {
    this.speechQueue.push(text); // Add the text to the queue
    if (!this.isSpeaking) {
      await this.processQueue(); // If not currently speaking, start processing the queue
    }

  }

  async processQueue(): Promise<void> {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false; // If no more items in the queue, mark as not speaking
      return;
    }

    this.isSpeaking = true; // Set the speaking flag
    const currentText = this.speechQueue.shift(); // Get the first item from the queue
    if (currentText === undefined) return;

    if (this.speakerStatus) {
      try {
        await TextToSpeech.speak({
          text: currentText,
          lang: this.lang,
          rate: this.rate,
          pitch: this.pitch,
          volume: this.volume,
          category: this.category,
          voice: this.voiceId
        }).then(async () => {
          this.isSpeaking = false; // Reset speaking flag
          await this.processQueue(); // Continue processing the queue
          //('Speech completed successfully');
        }).catch(async (error) => {
          console.error('Failed to speak:', error);
          this.isSpeaking = false; // Reset speaking flag
          await this.processQueue(); // Continue processing the queue
        });

      } catch (error) {
        console.error('Failed to speak:', error);
        this.isSpeaking = false; // Reset speaking flag on catch
        await this.processQueue(); // Continue processing
      }
    }



  }

  async stopSpeaking(): Promise<void> {
    TextToSpeech.stop(); // Stop any ongoing speech
    this.speechQueue = []; // Clear the queue
    this.isSpeaking = false; // Reset speaking flag
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  async toggleAudio():Promise<boolean>{
    this.speakerStatus=this.speakerStatus?false:true;
    await this.preferencesService.setAudioStatus(this.speakerStatus);
    if(this.speakerStatus==false){
      if(this.isSpeaking){
        await this.stopSpeaking()
      }
    }
    this.audioStatusChanged.emit(this.speakerStatus);
    return this.speakerStatus;
  }

  // Implementa las demás funciones aquí como necesites
}
