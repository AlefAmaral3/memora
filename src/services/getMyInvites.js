import { auth } from "../firebase/firebaseConfig";

export async function getMyInvites() {
  try {
    if (!auth.currentUser) {
      console.log("❌ Utilizador não autenticado");
      return [];
    }

    const userId = auth.currentUser.uid;
    console.log(`🔍 [getMyInvites] (API) Procurando convites para: ${userId}`);

    const url = `https://api-5yqejumh5a-uc.a.run.app/invites/my?uid=${encodeURIComponent(
      userId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`📡 [getMyInvites] (API) Status resposta: ${response.status}`);

    const data = await response.json();
    console.log("📡 [getMyInvites] (API) Dados:", data);

    if (!response.ok) {
      throw new Error(data.error || "Erro ao obter convites");
    }

    const invites = data.invites || [];
    console.log(
      `✓ [getMyInvites] (API) ${data.totalEventsChecked} eventos verificados, ${data.invitesFound} convites encontrados`
    );

    return invites;
  } catch (err) {
    console.error("❌ [getMyInvites] Erro crítico:", err);
    return [];
  }
}
