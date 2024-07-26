import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-iron-bot-modal',
  templateUrl: './iron-bot-modal.component.html',
  styleUrls: ['./iron-bot-modal.component.scss'],
})
export class IronBotModalComponent {
  userInput: string = '';
  response: string = '';
  interactionHistory: { question: string; answer: string }[] = [];

  constructor(private http: HttpClient, private modalCtrl: ModalController) {}

  askIronBot() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': environment.firebaseConfig.apiKey,
    });

    this.http
      .post<{ reply: string }>('https://us-central1-key-scarab-426901-c0.cloudfunctions.net/ironBot', { message: this.userInput }, { headers })
      .subscribe(
        (response) => {
          this.response = response.reply;
          this.interactionHistory.push({ question: this.userInput, answer: this.response });
          this.userInput = '';
        },
        (error) => {
          console.error('Error:', error);
        }
      );
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  endInteraction() {
    this.userInput = '';
    this.response = '';
    this.interactionHistory = [];
  }
}
