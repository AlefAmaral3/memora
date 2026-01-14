/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

/**
 * ⚠️ ATENÇÃO:
 * NÃO inicializar Auth aqui
 * Service Worker serve APENAS para push notifications
 */

firebase.initializeApp({
  messagingSenderId: "1084986950312",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Mensagem recebida em background:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});
