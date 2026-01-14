import {
  collectionGroup,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { auth } from "../firebase/firebaseConfig";

export async function getMyEvents() {
  const uid = auth.currentUser.uid;

  const q = query(
    collectionGroup(db, "participants"),
    where("status", "==", "accepted"),
    where("__name__", ">=", uid),
    where("__name__", "<=", uid)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    eventId: d.ref.parent.parent.id,
    role: d.data().role,
  }));
}
