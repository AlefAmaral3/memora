import {
  collection,
  getDocs,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function searchUsers(term) {
  if (!term || term.length < 2) return [];

  // Se for um email, procurar por email
  if (term.includes("@")) {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", term)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      
      // Se não encontrou ninguém, retorna opção de convite por email
      if (results.length === 0) {
        return [{
          uid: null,
          email: term,
          displayName: `Convidar ${term}`,
          isEmailInvite: true,
        }];
      }
      return results;
    } catch (error) {
      console.log("Erro ao procurar por email:", error);
      // Se não encontrar, retorna o email para convite direto
      return [{
        uid: null,
        email: term,
        displayName: `Convidar ${term}`,
        isEmailInvite: true,
      }];
    }
  }

  // Procurar por displayName
  try {
    const q = query(
      collection(db, "users"),
      orderBy("displayName"),
      startAt(term),
      endAt(term + "\uf8ff"),
      limit(10)
    );

    const snap = await getDocs(q);

    const results = snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    console.log(`🔍 Procura por nome "${term}": ${results.length} resultados`);
    
    // Se encontrou, retorna
    if (results.length > 0) {
      return results;
    }
    
    // Se não encontrou, tenta sugerir como email (se parecer um email)
    if (term.includes("@")) {
      console.log(`📧 Nenhum utilizador encontrado, sugerindo como email: ${term}`);
      return [{
        uid: null,
        email: term,
        displayName: `Convidar ${term}`,
        isEmailInvite: true,
      }];
    }
    
    // Se não encontrou e não é email, retorna vazio mas mostra mensagem
    console.log(`❌ Nenhum utilizador encontrado para "${term}"`);
    return [];
  } catch (error) {
    console.error(`❌ Erro ao procurar por nome "${term}":`, error);
    return [];
  }
}
