import { WebSocketSubject, webSocket } from 'rxjs/webSocket'; // Puedes usar `rxjs/webSocket` para manejar WebSocket de forma reactiva.

export class WebSocketService {
  private webSocket: WebSocket | null = null;
  private reconnectionAttempts = 0;
  private readonly maxReconnectionAttempts = 10; // Número máximo de intentos de reconexión
  private readonly reconnectionDelay = 2000; // Tiempo de espera entre intentos en milisegundos (2 segundos)
  private isManuallyClosed = false; // Bandera para evitar reconexiones si el cierre fue manual

  constructor() {}

  // Método para conectar al WebSocket (devuelve una promesa)
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isManuallyClosed=false;
      const wsUrl = `wss://geov2.ironstreet.com.uy`;
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        //console.log('Conexión WebSocket abierta');
        this.reconnectionAttempts = 0; // Reiniciar el contador de intentos de reconexión al conectarse con éxito
        resolve(); // Resolver la promesa, ya estamos conectados
      };

      this.webSocket.onerror = (error) => {
        console.error('Error en la conexión WebSocket:', error);
        this.reconnect(resolve, reject); // Intentar reconectar si hay un error
      };

      this.webSocket.onclose = (event) => {
        if (!this.isManuallyClosed) {
          console.warn('Conexión WebSocket cerrada inesperadamente:', event);
          this.reconnect(resolve, reject); // Intentar reconectar si la conexión se cerró inesperadamente
        } else {
          //console.log('Conexión WebSocket cerrada manualmente, no se intentará reconectar.');
          reject('Conexión cerrada manualmente'); // Rechazar la promesa si la conexión fue cerrada manualmente
        }
      };
    });
  }

  // Método para intentar reconectar
  private reconnect(resolve: () => void, reject: (reason?: any) => void) {
    if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      this.reconnectionAttempts++;
      //console.log(`Intentando reconectar... (Intento ${this.reconnectionAttempts})`);
      setTimeout(() => {
        this.connect()
          .then(resolve) // Si la reconexión tiene éxito, resolver la promesa
          .catch(reject); // Si falla después de varios intentos, rechazar la promesa
      }, this.reconnectionDelay);
    } else {
      console.error(`Se alcanzó el número máximo de intentos de reconexión (${this.maxReconnectionAttempts}).`);
      reject('Máximo de intentos de reconexión alcanzado'); // Rechazar la promesa si se alcanzó el máximo de intentos
    }
  }

  // Método para enviar un mensaje a través del WebSocket
  sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify(message));
        this.webSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            resolve(data);
          } catch (error) {
            reject('Error al parsear la respuesta del servidor');
          }
        };
      } else {
        reject('WebSocket no está conectado');
      }
    });
  }

  // Método para cerrar la conexión manualmente y evitar reconexiones automáticas
  closeConnection() {
    if (this.webSocket) {
      this.isManuallyClosed = true; // Establecer la bandera para evitar reconexión
      this.webSocket.close(); // Cerrar la conexión WebSocket
      //console.log('Conexión WebSocket cerrada manualmente.');
    }
  }
}