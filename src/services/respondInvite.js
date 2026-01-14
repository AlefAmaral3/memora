import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function respondInvite({ eventId, userId, status }) {
  try {
    const ref = doc(db, "events", eventId, "participants", userId);

    await updateDoc(ref, {
      status, // "accepted" | "rejected"
    });
    
    return { success: true };
  } catch (err) {
    console.error("Erro ao responder convite:", err);
    throw new Error(`Erro ao responder convite: ${err.message}`);
  }
}
