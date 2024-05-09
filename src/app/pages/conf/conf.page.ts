import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TTSOptions } from '@capacitor-community/text-to-speech';
import { VoiceService } from 'src/app/services/voice.service';
import { ThemeService } from '../../services/theme-service.service';
@Component({
  selector: 'app-conf',
  templateUrl: './conf.page.html',
  styleUrls: ['./conf.page.scss'],
})
export class ConfPage implements OnInit {
  //VOICE CONFIG
  isLoading: boolean = false;
  voices: SpeechSynthesisVoice[] = [];
  textToSpeak: string = "";
  voiceId: number = 0;
  pitch: number = 1;
  rate: number = 1;
  volume: number = 1;
  lan: string = "es-ES";
  category: string = "ambient";
  marker: string = "marker";
  isMarker: boolean = true;
  isMarkerEnabled: boolean = true;

  //APPEARENCE CONFIG
  isDarkMode: boolean = false;
  isLightMode: boolean = false;
  isAutoMode: boolean = false;
  highContrast: boolean = false;
  fontSize: 'small' | 'medium' | 'large' = 'medium';
  backgroundColor: string = "#000000";


  constructor(private router: Router, private voiceService: VoiceService, private themeService: ThemeService) {


  }

  async ngOnInit() {
    this.isLoading = true;
    if (this.themeService.isDarkMode) {
      this.isDarkMode = true;
      this.isLightMode = false;
      this.isAutoMode = false;
    } else if (this.themeService.isLightMode) {
      this.isDarkMode = false;
      this.isLightMode = true;
      this.isAutoMode = false;
    }
    this.voices = await this.voiceService.getVoices();

    this.isLoading = false;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.isLightMode = !this.isLightMode;
    this.isAutoMode = !this.isAutoMode;
    this.themeService.toggleTheme();
  }

  toggleHighContrast(): void {
    this.highContrast = !this.highContrast;
    this.themeService.toggleHighContrast(this.highContrast);
  }

  changeFontSize(): void {
    this.themeService.changeFontSize(this.fontSize);
  }

  changeBackgroundColor(): void {
    this.themeService.changeBackgroundColor(this.backgroundColor);
  }

  selectVouceLang() {
    this.voiceService.selectLang(this.lan);
  }

  speakWithParms(): void {
    const options: TTSOptions = {
      text: this.textToSpeak,
      lang: this.lan,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
      category: this.category,
      voice: this.voiceId
    };
    this.voiceService.speakWithOptions(options);
  }


  speak(text: string, voiceId: number): void {
    this.voiceService.speakWithVoice(text, voiceId);
  }

  selectVoiceById() {
    this.voiceService.selectVoiceById(this.voiceId);
  }
}
