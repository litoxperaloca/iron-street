import { Component, OnInit } from '@angular/core';
import { PreferencesService } from 'src/app/services/preferences.service';
import { ThemeService } from 'src/app/services/theme-service.service';
import { VoiceService } from 'src/app/services/voice.service';
import { HomePage } from '../home/home.page';
@Component({
  selector: 'app-conf',
  templateUrl: './conf.page.html',
  styleUrls: ['./conf.page.scss'],
})
export class ConfPage implements OnInit {
  preferences = {
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

  availableVoices: string[] = []; // Aquí puedes poner la lista de voces disponibles
  mapStyles = [
    '3D atardecer', 'Estilo 1', 'Estilo 2', 'Estilo 3',
    'Estilo 4', 'Estilo 5', 'Estilo 6', 'Estilo 7',
    'Estilo 8', 'Estilo 9', 'Estilo 10', 'Estilo 11'
  ];

  constructor(
    private preferencesService: PreferencesService,
    private voiceService: VoiceService,
    private themeService: ThemeService) {
    this.voiceService.getVoices().then((voices) => {
      if (voices) {
        voices.forEach(element => {
          this.availableVoices.push(element.voiceURI);
        });
      }
    });
  }

  ngOnInit() {
    this.loadPreferences();

  }

  async toggleTheme() {
    this.preferencesService.changeTheme(this.preferences.darkTheme).then(async () => {
      await this.preferencesService.savePreferences(this.preferences);
    });
  }

  async changeLanguage() {
    this.preferencesService.changeLanguage(this.preferences.language).then(async () => {
      await this.preferencesService.savePreferences(this.preferences);
    });
  }

  async selectVoice(voice: string) {
    this.preferences.voice = voice;
    this.preferences.voiceId = this.availableVoices.indexOf(voice);
    await this.savePreferences();
  }

  async loadPreferences() {
    this.preferences = await this.preferencesService.getPreferences();
  }

  async savePreferences() {
    this.preferencesService.savePreferences(this.preferences).then(() => {
      this.voiceService.conf().then(() => {


        if (this.preferences.voiceInstructions) {
          if ((window as any).homePage) {
            ((window as any).homePage as HomePage).audioOn = true;
          }
          this.voiceService.speakerStatus = true;
          this.voiceService.isSpeaking = false;
        } else {
          if ((window as any).homePage) {
            ((window as any).homePage as HomePage).audioOn = false;
          }
          this.voiceService.speakerStatus = false;
          this.voiceService.isSpeaking = false;
        }
      });
    });

  }
}
