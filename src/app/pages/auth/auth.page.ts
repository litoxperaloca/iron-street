import { Component, OnInit } from '@angular/core';
import { AuthenticatorService, translations } from '@aws-amplify/ui-angular';
import { AuthUser } from 'aws-amplify/auth';
import { I18n } from 'aws-amplify/utils';
import { PreferencesService } from 'src/app/services/preferences.service';
@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  userLogged: AuthUser | undefined;
  userIsLogged: boolean = false;


  constructor(private preferencesService: PreferencesService, public authenticator: AuthenticatorService) {
    this.authenticator.subscribe(state => {
      if (state.user) {
        this.userLogged = state.user;
        this.userIsLogged = true;
      } else {
        this.userIsLogged = false;
        this.userLogged = undefined;
      }
    })
    this.preferencesService.languageChanged.subscribe(lang => {
      this.setTranslations(lang);
    });
  }

  async ngOnInit() {
    if (this.authenticator.user) {
      this.userLogged = this.authenticator.user;
      this.userIsLogged = true;
    } else {
      this.userIsLogged = false;
      this.userLogged = undefined;
    }
    await this.preferencesService.getLanguage().then(lang => {
      this.setTranslations(lang);
    });


  }

  private setTranslations(lang: string) {
    I18n.putVocabularies(translations);
    I18n.setLanguage(lang);
  }
  async signOut() {
    try {
      this.authenticator.signOut();
      this.userLogged = undefined;
      this.userIsLogged = false;
    } catch (error) {
      console.log('error signing out: ', error);
    }
  }

  async viewNotifications() {

  }

  async viewDrivingStats() {

  }

  async viewTripsHistory() {

  }

  async verifyEmail() { }

  async editProfile() { }

}
