import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  speechRecogEnabled = false;
  results: any[] = [];
  isNative: boolean;

  constructor(private toastController: ToastController) {
    this.isNative = Capacitor.isNativePlatform()
    if (this.isNative) {
      this.initializeSpeechRecognition();
    }
  }


  async initializeSpeechRecognition() {
    const status = await SpeechRecognition.requestPermissions();
    this.speechRecogEnabled = status.speechRecognition === 'granted';

  }

  async toggleSpeechRecognition() {
    if (this.isNative) {
      if (!this.speechRecogEnabled) {
        const status = await SpeechRecognition.requestPermissions();
        if (status.speechRecognition != 'granted') { // Fix the condition here
          this.presentToast('Speech recognition permission was denied');
          return;
        }
      }

      this.speechRecogEnabled = !this.speechRecogEnabled;
      this.speechRecogEnabled ? this.startSpeechRecognition() : this.stopSpeechRecognition();
    }
  }

  async startSpeechRecognition() {
    if (this.isNative) {
      try {
        interface UtteranceOptions {
          language?: string;
          onResult?: (result: any, isFinal: any) => void; // Add this line
          onError?: () => void;
        }

        await SpeechRecognition.start({
          language: 'es-UY',
          prompt: "Cuando quieras hacer algo, me puedes indicar diciendo por ejemplo: 'Peterson, abre mapa. Busca ruta con destino calle tal esquina tal. '", // Add this line

          popup: true,
          partialResults: true,
          maxResults: 1,

        }).then((result) => {
          //console.log('Speech Recognition Result:', result);
          //this.presentToast(`Speech recognition result: ${result}`);
          // Do something with the result
          // ...
          this.results.push(result)
          let resultsStr: string = '';
          result.matches?.forEach(match => {
            resultsStr += match + '\n';
          });
          this.presentToast('Speech recognition result:' + resultsStr);

        }).catch((error) => {
          this.presentToast('Speech recognition started' + error);
          console.error('Error starting speech recognition:', error);
          this.presentToast('Failed to start speech recognition');
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        this.presentToast('Failed to start speech recognition' + error);
      }
    }
    // Existing code...
  }

  async stopSpeechRecognition() {
    if (this.isNative) await SpeechRecognition.stop(); // Change this line
    //this.presentToast('Speech recognition stopped');
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }
}
