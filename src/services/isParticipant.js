import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function isParticipant(eventId, userId) {
  const ref = doc(db, "events", eventId, "participants", userId);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
}