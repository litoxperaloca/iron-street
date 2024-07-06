import { Component } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-iron-bot-modal',
  templateUrl: './iron-bot-modal.component.html',
  styleUrls: ['./iron-bot-modal.component.scss']
})
export class IronBotModalComponent {
  userInput: string = '';
  response: string | null = null;
  interactionHistory: Array<{ question: string, answer: string }> = [];

  constructor(private authService: AuthService) { }

  async askIronBot() {
    try {
      const user = this.authService.getUser();
      if (user && user.emailVerified) {
        const token = await user.getIdToken();
        const options = {
          url: `${environment.firebaseFunctionsUrl}/api`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            question: this.userInput,
            previousInteraction: this.interactionHistory
          }
        };

        const result: HttpResponse = await CapacitorHttp.request(options);
        this.response = result.data.answer;
        if (this.response) this.interactionHistory.push({ question: this.userInput, answer: this.response });
        this.userInput = '';
      } else {
        throw new Error('User not authenticated or email not verified');
      }
    } catch (error) {
      console.error('Error querying IronBot:', error);
      this.response = 'An error occurred while querying IronBot';
    }
  }


  endInteraction() {
    this.response = null;
    this.interactionHistory = [];
  }
}
