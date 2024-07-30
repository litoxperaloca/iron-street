// src/app/pages/profile/profile.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'firebase/auth';
import { AuthService } from '../../services/auth.service';

export interface UserInfo {
  nacionalidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; // Puedes considerar usar un tipo Date si lo prefieres
  numeroLicenciaConducir: string;
  fechaExpiracionLicencia: string; // Puedes considerar usar un tipo Date si lo prefieres
  paisEmisionLicencia: string;
  // Agrega más campos según sea necesario
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  profileSegment: string = 'personal-info';
  monthlyStats!: any;
  displayName: string | null = '';
  email: string | null = '';
  photoURL: string | null = '';


  userInfo: UserInfo = {
    nacionalidad: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '', // Puedes considerar usar un tipo Date si lo prefieres
    numeroLicenciaConducir: '',
    fechaExpiracionLicencia: '', // Puedes considerar usar un tipo Date si lo prefieres
    paisEmisionLicencia: '',
  }


  constructor(private translate: TranslateService, private router: Router, private authService: AuthService) { }

  async ngOnInit() {
    await this.loadUserProfile();
    if (this.user) {
      await this.loadMonthlyStats();
    } else {
      this.router.navigateByUrl('/auth', { replaceUrl: true });
    }
  }

  async loadUserProfile() {
    this.user = this.authService.getUser();
    if (this.user && this.user.providerData) {
      this.displayName = this.user.providerData[0].displayName
        ? this.user.providerData[0].displayName
        : this.user.displayName;
      this.email = this.user.email;
      this.photoURL = this.user.photoURL;
    } else {
      // Manejar el caso en que no se encuentre el usuario
      console.error('No se encontró el usuario en la base de datos.');
    }
  }

  async saveUserInfo() {
    try {
      await this.authService.updateUserInfo(this.userInfo);
      // Mostrar mensaje de éxito
      //console.log('Información actualizada exitosamente.');
    } catch (error) {
      // Manejar errores
      console.error('Error al actualizar la información:', error);
    }
    //SET
  }


  async loadMonthlyStats() {
    // Mock data, replace with actual data retrieval logic
    this.monthlyStats = {
      totalKilometers: 1200,
      speedingViolations: 3
    };
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/auth', { replaceUrl: true });
  }

  // Método para actualizar la información del usuario
  async updateUserInfo() {
    try {
      await this.authService.updateUserInfo(this.userInfo);
      // Mostrar mensaje de éxito
      //console.log('Información actualizada exitosamente.');
    } catch (error) {
      // Manejar errores
      console.error('Error al actualizar la información:', error);
    }
  }

  // Método para cambiar el segmento de la página
  changeSegment(segment: string) {
    this.profileSegment = segment;
  }

  //TODO: obtener la info del usuario de cada provider para mostrar en el template de esta pagina
  //TODO: implementar la funcionalidad de editar la info del usuario
  //TODO: implementar la funcionalidad de cambiar la contraseña del usuario
  //TODO: implementar la funcionalidad de eliminar la cuenta del usuario
  //TODO: implementar la funcionalidad de cambiar el idioma de la app
  //TODO: implementar la funcionalidad de cambiar el tema de la app
  //TODO: implementar la funcionalidad de cambiar el nombre de usuario
  //TODO: implementar la funcionalidad de cambiar la foto de perfil del usuario
  //TODO: implementar la funcionalidad de cambiar el correo electrónico del usuario
  //TODO: implementar la funcionalidad de cambiar el número de teléfono del usuario
  //TODO: implementar la funcionalidad de cambiar la dirección del usuario
  //TODO: implementar la funcionalidad de cambiar la ciudad del usuario
  //TODO: implementar la funcionalidad de cambiar el país del usuario
  //TODO: implementar la funcionalidad de cambiar la fecha de nacimiento del usuario
  //TODO: implementar la funcionalidad de cambiar el género del usuario
  //TODO: implementar la funcionalidad de cambiar la ocupación del usuario
  //TODO: implementar la funcionalidad de cambiar la educación del usuario
  //TODO: implementar la funcionalidad de cambiar la información de contacto del usuario
  //TODO: implementar la funcionalidad de cambiar la información de pago del usuario
  //TODO: implementar la funcionalidad de cambiar la información de envío del usuario
  //TODO: implementar la funcionalidad de cambiar la información de facturación del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la licencia de conducir del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la tarjeta de crédito del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la tarjeta de débito del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta bancaria del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de PayPal del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Stripe del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Google Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Apple Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Samsung Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Amazon Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Facebook Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de WeChat Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Alipay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Line Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Kakao Pay del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Paytm del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de PhonePe del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Google Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Apple Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Samsung Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Amazon Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Facebook Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de WeChat Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Alipay Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Line Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Kakao Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Paytm Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de PhonePe Wallet del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Google Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Apple Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Samsung Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Amazon Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Facebook Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de WeChat Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Alipay Pay for Business del usuario
  //TODO: implementar la funcionalidad de cambiar la información de la cuenta de Line

  //EN cada NG-on
}
