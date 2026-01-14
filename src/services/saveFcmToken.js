import { getToken } from "firebase/messaging";
import { messaging } from "../firebase/messaging";
import { auth } from "../firebase/firebaseConfig";

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Permissão de notificação concedida");
      
      // Obter token FCM
      const token = await getToken(messaging, {
        vapidKey: "BBbu40Dw1z1zYNN-Hnz2we6wZSlVTo8RmHlOpFZaqF1wpugmNi5ZJw1goEGCywYXyDWkETLXIRFb8W5l5i2vkFl",
      });
      
      if (token) {
        console.log("Token FCM obtido:", token);
        
        // Salvar no backend
        const user = auth.currentUser;
        if (user) {
          await saveFcmTokenToBackend(user.uid, token);
        }
        
        return token;
      } else {
        console.log("Nenhum token disponível");
      }
    } else {
      console.log("Permissão de notificação negada");
    }
  } catch (error) {
    console.error("Erro ao obter permissão de notificação:", error);
  }
  
  return null;
}

async function saveFcmTokenToBackend(userId, token) {
  try {
    const response = await fetch(
      "https://us-central1-memora-dbba3.cloudfunctions.net/saveFcmToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, token }),
      }
    );
    
    if (!response.ok) {
      throw new Error("Erro ao salvar token no backend");
    }
    
    console.log("Token FCM salvo com sucesso no backend");
  } catch (error) {
    console.error("Erro ao salvar token FCM:", error);
  }
}
