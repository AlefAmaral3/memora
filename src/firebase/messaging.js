// src/firebase/messaging.js
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebaseConfig";

// Usa a MESMA app já inicializada em firebaseConfig.js
export const messaging = getMessaging(app);

// Gera o token FCM do navegador
export async function requestUserForPush() {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });
    console.log("FCM token:", token);
    return token;
  } catch (err) {
    console.error("Erro ao obter token FCM:", err);
    return null;
  }
}

// Opcional: ouvir mensagens quando a página está aberta
export function listenForegroundMessages(callback) {
  onMessage(messaging, callback);
}
