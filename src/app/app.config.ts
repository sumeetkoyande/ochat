import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'ochat-05',
        appId: '1:506718035032:web:ec3903c35256adcdf63e2d',
        storageBucket: 'ochat-05.firebasestorage.app',
        apiKey: 'AIzaSyDTjOhZbW6lVpeUCgg3tA44am4wRIzJf4s',
        authDomain: 'ochat-05.firebaseapp.com',
        messagingSenderId: '506718035032',
        measurementId: 'G-FYJQR775YJ',
      })
    ),
    provideAuth(() => {
      const auth = getAuth();
      connectAuthEmulator(auth, 'http://localhost:9099', {
        disableWarnings: true,
      });
      return auth;
    }),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideFirestore(() => {
      const firestore = getFirestore();
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      return firestore;
    }),
    provideDatabase(() => getDatabase()),
    provideMessaging(() => getMessaging()),
  ],
};
