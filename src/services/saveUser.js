import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function saveUser(user) {
  const ref = doc(db, "users", user.uid);

  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  }, { merge: true });
}
