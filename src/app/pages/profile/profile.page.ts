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
      console.log('Información actualizada exitosamente.');
    } catch (error) {
      // Manejar errores
      console.error('Error al actualizar la información:', error);
    }
  }
}
