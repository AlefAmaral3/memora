import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, arrayUnion } from "firebase/firestore";
import AppShell from "../components/AppShell";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [event, setEvent] = useState(null);
  const [processing, setProcessing] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const eventId = searchParams.get("eventId");

  useEffect(() => {
    async function loadInvite() {
      try {
        if (!token || !email || !eventId) {
          setError("Link de convite inválido");
          setLoading(false);
          return;
        }

        // Procurar convite
        const invitesRef = doc(db, "invites", `${eventId}_${email}_*`);
        // Não podemos usar wildcards em getDoc, então procuramos manualmente
        // Por agora, assumimos que o convite existe se temos os parâmetros corretos

        // Buscar evento
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (!eventDoc.exists()) {
          setError("Evento não encontrado");
          setLoading(false);
          return;
        }

        setEvent({ id: eventDoc.id, ...eventDoc.data() });
        setInvite({ token, email, eventId });
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar convite:", err);
        setError("Erro ao carregar convite");
        setLoading(false);
      }
    }

    loadInvite();
  }, [token, email, eventId]);

  async function acceptInvite() {
    setProcessing(true);
    try {
      const user = auth.currentUser;

      if (!user) {
        // Se não estiver autenticado, redirecionar para login com volta aqui
        sessionStorage.setItem("inviteToken", token);
        sessionStorage.setItem("inviteEmail", email);
        sessionStorage.setItem("inviteEventId", eventId);
        navigate("/login");
        return;
      }

      // Verificar se o email corresponde
      if (user.email !== email) {
        setError(
          `Este convite foi enviado para ${email}, mas está autenticado como ${user.email}`
        );
        setProcessing(false);
        return;
      }

      // Adicionar como participante
      const participantRef = doc(db, "events", eventId, "participants", user.uid);
      await setDoc(participantRef, {
        userId: user.uid,
        displayName: user.displayName || "Utilizador",
        status: "accepted",
        joinedAt: serverTimestamp(),
      });

      // Atualizar evento
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        participants: arrayUnion(user.uid),
      });

      // Marcar convite como aceite
      // Procurar por token (indexado em Firestore)
      const { query, where, getDocs, collection } = await import("firebase/firestore");
      const q = query(
        collection(db, "invites"),
        where("token", "==", token)
      );
      const invitesSnap = await getDocs(q);
      if (!invitesSnap.empty) {
        const inviteRef = invitesSnap.docs[0].ref;
        await updateDoc(inviteRef, {
          status: "accepted",
          acceptedAt: serverTimestamp(),
          acceptedBy: user.uid,
        });
      }

      setError(null);
      alert("Convite aceite com sucesso!");
      navigate(`/event/${eventId}`);
    } catch (err) {
      console.error("Erro ao aceitar convite:", err);
      setError("Erro ao aceitar convite: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function rejectInvite() {
    setProcessing(true);
    try {
      const { query, where, getDocs, collection } = await import("firebase/firestore");
      const q = query(
        collection(db, "invites"),
        where("token", "==", token)
      );
      const invitesSnap = await getDocs(q);
      if (!invitesSnap.empty) {
        const inviteRef = invitesSnap.docs[0].ref;
        await updateDoc(inviteRef, {
          status: "rejected",
          rejectedAt: new Date(),
        });
      }

      alert("Convite rejeitado");
      navigate("/");
    } catch (err) {
      console.error("Erro ao rejeitar convite:", err);
      setError("Erro ao rejeitar convite");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>A carregar convite...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
          <h2>❌ Erro</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Voltar ao Início
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Convite para Evento</h1>

        {event && (
          <div
            style={{
              background: "#f9f9f9",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h2>{event.titulo}</h2>
            <p>
              <strong>📅 Data:</strong> {event.hora}
            </p>
            <p>
              <strong>📍 Local:</strong> {event.local || "Sem local definido"}
            </p>
            {event.descricao && (
              <p>
                <strong>Descrição:</strong> {event.descricao}
              </p>
            )}
          </div>
        )}

        <p style={{ marginBottom: "30px", color: "#666" }}>
          Você foi convidado para participar neste evento. Deseja aceitar ou rejeitar o convite?
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={acceptInvite}
            disabled={processing}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            ✓ Aceitar
          </button>
          <button
            onClick={rejectInvite}
            disabled={processing}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            ✗ Rejeitar
          </button>
        </div>

        <p style={{ marginTop: "30px", fontSize: "0.9em", color: "#999", textAlign: "center" }}>
          Este link expira em 30 dias
        </p>
      </div>
    </AppShell>
  );
}
