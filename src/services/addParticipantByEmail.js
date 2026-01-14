import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Convida um utilizador por email (mesmo que não esteja registado)
 * Cria um convite e envia email via Cloud Function
 */
export async function addParticipantByEmail(eventId, email) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Utilizador não autenticado");
  }

  // Buscar evento
  const eventDoc = await getDoc(doc(db, "events", eventId));
  if (!eventDoc.exists()) {
    throw new Error("Evento não encontrado");
  }

  const eventData = eventDoc.data();

  // Verificar se é proprietário
  if (eventData.ownerId !== user.uid) {
    throw new Error("Apenas o proprietário pode convidar");
  }

  // Criar token de convite único
  const inviteToken = Math.random().toString(36).substring(2, 15);

  // Guardar convite no Firestore
  const inviteRef = doc(db, "invites", `${eventId}_${email}_${Date.now()}`);
  await setDoc(inviteRef, {
    eventId,
    email,
    token: inviteToken,
    status: "pending",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
  });

  // Chamar Cloud Function para enviar email
  const functionUrl = `https://us-central1-memora-dbba3.cloudfunctions.net/sendInviteEmail`;
  
  const payload = {
    email,
    eventId,
    eventTitle: eventData.titulo,
    eventDate: eventData.hora,
    inviteToken,
    organizerName: user.displayName || "Memora",
  };
  
  console.log("📧 Enviando payload para sendInviteEmail:", payload);
  
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  console.log("📮 Resposta da Cloud Function:", responseData);

  if (!response.ok) {
    console.error("❌ Erro ao enviar email. Status:", response.status, "Resposta:", responseData);
    throw new Error(responseData.error || "Erro ao enviar email de convite");
  }

  return {
    success: true,
    message: `Convite enviado para ${email}`,
  };
}
