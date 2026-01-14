import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function addParticipant({ eventId, userId, role = "guest" }) {
  if (!eventId || !userId) {
    throw new Error("eventId e userId são obrigatórios");
  }

  // Obter dados do utilizador (para ter o email e nome)
  let userEmail = null;
  let displayName = "Guest";
  
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      userEmail = userDoc.data().email;
      displayName = userDoc.data().displayName || "Guest";
    }
  } catch (err) {
    console.warn("Erro ao obter dados do utilizador:", err);
  }

  // Adicionar como participante com o nome salvo
  const ref = doc(db, "events", eventId, "participants", userId);
  await setDoc(
    ref,
    {
      role,
      displayName,
      status: "pending",
      invitedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Se conseguiu o email, enviar notificação por email
  if (userEmail) {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        
        // Obter dados do organizador (para mostrar no email)
        const organizerDoc = await getDoc(doc(db, "users", eventData.ownerId));
        const organizerName = organizerDoc.exists() 
          ? organizerDoc.data().displayName 
          : "Memora";

        // Enviar email via Cloud Function
        const functionUrl = `https://us-central1-memora-dbba3.cloudfunctions.net/sendParticipantNotification`;
        const payload = {
          email: userEmail,
          eventId,
          eventTitle: eventData.titulo,
          eventDate: eventData.hora,
          organizerName,
        };

        console.log("📧 Enviando notificação para participante:", payload);
        
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
          console.warn("⚠️ Erro ao enviar email de notificação:", responseData);
        } else {
          console.log("✓ Email de notificação enviado para", userEmail);
        }
      }
    } catch (err) {
      console.warn("⚠️ Erro ao enviar notificação de participante:", err);
    }
  }
}
