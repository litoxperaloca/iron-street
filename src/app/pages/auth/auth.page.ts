import { Component, OnInit } from '@angular/core';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { Auth } from 'aws-amplify';
/*@Component({
  selector: 'app-auth',
  template: `
    <amplify-authenticator></amplify-authenticator>
  `
})
export class AuthComponent {
  constructor(private amplifyService: AmplifyService) {
    this.amplifyService.authStateChange$
      .subscribe(authState => {
        if (authState.state === 'signedIn') {
          console.log('User successfully signed in!');
        }
      });
  }
}*/

@Component({
  imports: [AmplifyAuthenticatorModule],
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  async signOut() {
    try {
      Auth.signOut();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  }
}
