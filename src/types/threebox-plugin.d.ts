declare module 'threebox-plugin' {
    export class Threebox {
      loadObj(options: { obj: string; type: string; scale: { x: number; y: number; z: number; }; units: string; rotation: { x: number; y: number; z: number; }; }, arg1: (model: any) => void);
      update();
      constructor(map: any, glContext: any, options: any);
      Object3D(options: any): any;
      add(obj: any): void;
      // Agrega otros métodos y propiedades que uses de Threebox
    }
  }