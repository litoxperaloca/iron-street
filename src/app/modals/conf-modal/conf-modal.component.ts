import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HomePage } from 'src/app/pages/home/home.page';
import { ModalService } from 'src/app/services/modal.service';
import { PreferencesService } from 'src/app/services/preferences.service';
import { VoiceService } from 'src/app/services/voice.service';
@Component({
  selector: 'app-conf-modal',
  templateUrl: './conf-modal.component.html',
  styleUrls: ['./conf-modal.component.scss'],
})
export class ConfModalComponent {
  modalVars = { title: "" };
  extraParam: boolean = false;
  loading: boolean = false;

  preferences = {
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


  dismiss() {
    this.modalController.dismiss();
  }

  availableVoices: string[] = []; // Aquí puedes poner la lista de voces disponibles
  mapStyles = [
    '3D atardecer', 'Estilo 1', 'Estilo 2', 'Estilo 3',
    'Estilo 4', 'Estilo 5', 'Estilo 6', 'Estilo 7',
    'Estilo 8', 'Estilo 9', 'Estilo 10', 'Estilo 11'
  ];

  constructor(private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private preferencesService: PreferencesService,
    private voiceService: VoiceService,
    private translate: TranslateService) {
    if (this.navParams.get('isFinalDestination')) {
      this.extraParam = this.navParams.get('extraParam'); // Accessing the passed parameter

    }
    this.loadPreferences();
    this.voiceService.getVoices().then((voices) => {
      if (voices) {
        voices.forEach(element => {
          this.availableVoices.push(element.voiceURI);
        });
      }
    });


  }

  selectVoice(voice: string) {
    this.preferences.voice = voice;
    this.preferences.voiceId = this.availableVoices.indexOf(voice);
    this.savePreferences();
  }

  async loadPreferences() {
    this.preferences = await this.preferencesService.getPreferences();
  }

  async savePreferences() {
    await this.preferencesService.savePreferences(this.preferences);
    this.voiceService.conf();

    if (this.preferences.voiceInstructions) {
      ((window as any).homePage as HomePage).audioOn = true;
      this.voiceService.speakerStatus = true;
      this.voiceService.isSpeaking = false;

    } else {
      ((window as any).homePage as HomePage).audioOn = false;
      this.voiceService.speakerStatus = false;
      this.voiceService.isSpeaking = false;
    }

  }

}
