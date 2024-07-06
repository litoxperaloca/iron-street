import { Injectable } from '@angular/core';
import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp, initializeApp } from "firebase/app";
import { AppCheck, ReCaptchaEnterpriseProvider, initializeAppCheck } from "firebase/app-check";
import { Auth, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { DocumentData } from 'firebase/firestore';
import { Firestore, collection, getDocs, getFirestore } from 'firebase/firestore/lite';
import { FirebasePerformance, getPerformance } from 'firebase/performance';
import { GenerativeModel, VertexAI, getGenerativeModel, getVertexAI } from "firebase/vertexai-preview";
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  app: FirebaseApp | undefined;
  analytics: Analytics | undefined;
  auth: Auth | undefined;
  performance: FirebasePerformance | undefined;
  appCheck: AppCheck | undefined;
  db: Firestore | undefined;
  // Initialize the Vertex AI service
  vertexAI: VertexAI | undefined;

  // Initialize the generative model with a model that supports your use case
  // Gemini 1.5 models are versatile and can be used with all API capabilities
  model: GenerativeModel | undefined;
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  constructor() { }

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries



  startApp(): void {
    // Initialize Firebase
    this.app = initializeApp(environment.firebaseConfig);
    this.analytics = getAnalytics(this.app);
    this.auth = getAuth(this.app);
    this.auth.useDeviceLanguage();
    // Initialize the Vertex AI service
    this.vertexAI = getVertexAI(this.app);

    // Initialize the generative model with a model that supports your use case
    // Gemini 1.5 models are versatile and can be used with all API capabilities
    this.model = getGenerativeModel(this.vertexAI, { model: "gemini-1.5-flash" });

    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    this.appCheck = initializeAppCheck(this.app, {
      provider: new ReCaptchaEnterpriseProvider('6LeIPgAqAAAAAEA12DY7Df3IraZbrqXPGDRI7Kv2'),

      // Optional argument. If true, the SDK automatically refreshes App Check
      // tokens as needed.
      isTokenAutoRefreshEnabled: true
    });

    this.performance = getPerformance(this.app);

    this.db = getFirestore(this.app);

  }

  createUserWithEmailAndPassword() {
    return createUserWithEmailAndPassword;
  }


  // Get a list of cities from your database
  async getUsers(db: Firestore): Promise<DocumentData[]> {
    const usersCol = collection(db, 'users');
    const usersnapshot = await getDocs(usersCol);
    const usersList = usersnapshot.docs.map(doc => doc.data());
    return usersList;
  }
}
