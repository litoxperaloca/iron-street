// maneuver.service.ts
import { Injectable } from '@angular/core';
import { VoiceService } from './voice.service';

@Injectable({
  providedIn: 'root'
})
export class ManeuverService {
  private currentInstructionElement: HTMLElement;

  constructor(private voiceService: VoiceService) {
    // Inicializar el elemento de la UI donde se mostrarán las instrucciones.
    // Este elemento debe estar presente en tu plantilla HTML.
    this.currentInstructionElement = document.getElementById('current-instruction') as HTMLElement;
  }

  /**
   * Interpreta y muestra la próxima maniobra, usando el servicio de voz para instrucciones auditivas
   * y actualizando la interfaz de usuario con la instrucción textual.
   * @param route Ruta completa desde la que extraer y mostrar las maniobras.
   */
  handleRouteManeuvers(route: any): void {
    const maneuvers = this.getManeuvers(route);

    maneuvers.forEach((maneuver, index) => {
      setTimeout(() => {
        this.displayManeuver(maneuver);
      }, index * 5000); // Ajusta este tiempo según sea necesario.
    });
  }

  /**
   * Obtiene las maniobras de una ruta.
   * @param route La ruta obtenida de la API de Directions.
   * @returns Una lista de maniobras.
   */
  private getManeuvers(route: any): any[] {
    // Implementación simplificada; ajusta según el formato de tus datos de ruta.
    return route.legs.flatMap((leg: any) => leg.steps).map((step: any) => step.maneuver);
  }

  /**
   * Muestra la maniobra actual en la interfaz de usuario y reproduce las instrucciones de voz.
   * @param maneuver La maniobra actual.
   */
  private displayManeuver(maneuver: any): void {
    // Actualiza la interfaz de usuario con la instrucción de maniobra.
    this.currentInstructionElement.innerHTML = maneuver.instruction;

    // Reproduce la instrucción de voz.
    this.voiceService.speak(maneuver.instruction);
  }
}
