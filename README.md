Iron Street: "Todos somos parte del tránsito, seamos todos parte de la solución"
Aplicación de navegación GPS híbrida y progresiva (PWA) de última generación.

<a href="https://g.co/gemini/share/ab08f3149454">ANALISIS Y REPORTE TECNICO SOBRE ESTA APP</a>

Problema que intenta resolver: 
  tránsito y seguridad vial. 
  Disminuir los accidentes de tránsito
  
Solución innovadora: 

  aportar a SEGURIDAD VIAL incentivando la conducción responsable mediante recompensas mensuales monetarias 
  (a quienes logran la meta mensual sin registrar faltas en la app)
  
Su MVP: 

  app que monitorea la conduccion del usuario, 
	
  detecta faltas y malos hábitos de conducción 
	
    exceso de velocidad, 
		
    sentido contrario, 
		
    señales de pare, 
		
    uso de dispositivo mientras conduce
		
  acumula km recorridos sin cometer esas faltas 
	
  al finalizar el mes recompenza a los conductores responsables con transferencias monetarias reales (de un pozo que se acumula con % de las suscripciones).
  
Sus funciones añadidas son: 

  la visualización de mapas en 3D en tiempo real, ofreciendo una experiencia de conducción inmersiva y rica en información. 
	
  Proporciona navegación asistida con instrucciones y alertas de voz para permitir concentrar la visión en la conducción y las manos en el volante.
	
  Busquedas userfriendly de lugares, direcciones e intersecciones, puntos de interés.
	
  Personalización de mapa y de marcador 3D del vehículo
	
  Multilenguaje
	
  UI con mejoras de accesibilidad
	
  Gestión de compra de ticket de estacionamiento urbano
  
La aplicación está construida con Ionic/Angular y Capacitor, lo que le permite ser desplegada en la web, iOS y Android desde una única base de código.

🚀 Características Principales

  Navegación 3D en Tiempo Real: Visualiza tu posición, vehículos y elementos del mapa en un entorno 3D dinámico.
	
  Multiplataforma: Una sola base de código para PWA, iOS y Android.
	
  Backend Inteligente: Un servidor Node.js procesa datos en tiempo real para detectar excesos de velocidad, cámaras cercanas y predecir tu ruta.
	
  Arquitectura Optimizada: Uso de PostgreSQL para almacenamiento de datos, y Memcached para un cacheo de alto rendimiento.
	
  Cálculo de Rutas Avanzado: Integración con el motor de enrutamiento Valhalla.
	
  Datos de OpenStreetMap (OSM): Acceso directo a la rica base de datos de OSM para información detallada.
	
  Interfaz de Usuario Moderna: Componentes modulares y una experiencia de usuario limpia.
  Soporte Multilingüe: Preparada para una audiencia global.
	

🛠️ Stack Tecnológico

La aplicación utiliza un stack moderno y robusto para ofrecer una experiencia fluida y potente.

  Categoría: Tecnología 
	
  Framework Principal: Ionic 8 / Angular 18 
	
  Integración Nativa:  Capacitor 7 

  Lenguaje: TypeScript (Frontend), JavaScript/Node.js (Backend) 
	
  Cartografía y 3D: Mapbox GL JS, Threebox.js / Three.js 
	
  Backend: Node.js, WebSocket, PostgreSQL, Memcached, Turf.js 
	
  APIs Externas: Valhalla (Map Matching), Traccar, OpenStreetMap 
	
  Pruebas: Karma, Jasmine 

🏗️ Arquitectura

El proyecto sigue una arquitectura cliente-servidor desacoplada que promueve la separación de responsabilidades.

  Frontend (Ionic/Angular): Gestiona la interfaz de usuario y la experiencia del cliente. Se comunica con el hardware a través de Capacitor y con el backend mediante un servicio WebSocket.
  
  Puente Nativo (Capacitor): Proporciona acceso a las funcionalidades del dispositivo como GPS y sensores.
  
  Backend (API Central en Node.js): 
	
    -Es el cerebro de la aplicación. Mantiene una conexión persistente con el cliente a través de WebSockets y es responsable de:
		
    -Procesar datos de geolocalización en tiempo real.    
		
    -Realizar map-matching con Valhalla para ajustar la ubicación del usuario a la red de carreteras.
		
    -Consultar la base de datos PostgreSQL para obtener límites de velocidad y datos de calles.
		
    -Utilizar Memcached para cachear consultas frecuentes y acelerar las respuestas.
		
    -Calcular infracciones de velocidad, kilómetros recorridos y alertas.
		
    -Enviar datos de seguimiento al sistema de administración Traccar.
  
  Base de Datos (PostgreSQL): Almacena todos los datos persistentes, incluyendo posiciones de usuarios, infracciones, recompensas y datos geoespaciales importados de OSM.

🏁 Cómo Empezar

Sigue estos pasos para configurar el proyecto en tu entorno de desarrollo local.

Prerrequisitos
Node.js (versión 18.x o superior)
NPM o Yarn
Ionic CLI (npm install -g @ionic/cli)
PostgreSQL, Memcached, Valhalla y Traccar corriendo localmente.

Instalación
Clona el repositorio:
  git clone https://github.com/tu-usuario/iron-street.git
  cd iron-street


Instala las dependencias (frontend):
  npm install
  Nota: Asegúrate de instalar también las dependencias del backend (npm install en la carpeta de la API).

Ejecuta la aplicación en modo de desarrollo:
  Para ver la aplicación en el navegador con recarga en vivo.
  ionic serve


📦 Builds para Producción
  
  - Aplicación Web Progresiva (PWA)
    npm run build
    El resultado se encontrará en la carpeta www/.


  Android
    Añadir la plataforma Android:
      ionic capacitor add android
    Sincronizar el proyecto:
      ionic capacitor sync android
    Abrir en Android Studio:
      ionic capacitor open android
    Desde Android Studio, puedes generar el APK o AAB.
  
  iOS
    Añadir la plataforma iOS:
      ionic capacitor add ios
    Sincronizar el proyecto:
      ionic capacitor sync ios
    Abrir en Xcode:
      ionic capacitor open ios
    Desde Xcode, puedes compilar y ejecutar la aplicación en un simulador o dispositivo físico.

📂 Estructura del Proyecto

El código fuente está organizado de manera intuitiva para facilitar la navegación y el desarrollo.

/src
├── /app
│   ├── /pages          # Componentes de página (vistas principales)
│   ├── /services       # Lógica de negocio y comunicación con APIs
│   ├── /modals         # Componentes para diálogos y pop-ups
│   ├── /custom-components # Componentes reutilizables (ej. velocímetro)
│   ├── app-routing.module.ts # Definición de rutas
│   └── app.module.ts   # Módulo principal de Angular
│
├── /assets             # Recursos estáticos (imágenes, modelos 3D, i18n)
│
└── ...                 # Archivos de configuración y de entrada

