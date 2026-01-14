import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getMyInvites } from "../services/getMyInvites";
import { auth } from "../firebase/firebaseConfig";

export default function InvitesPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        console.log("📋 InvitesPage: Iniciando carregamento");
        setError(null);
        setLoading(true);
        
        // Timeout de segurança de 15 segundos
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout: demorou muito a carregar")), 15000)
        );
        
        const loadPromise = (async () => {
          const list = await getMyInvites();
          return list;
        })();

        const list = await Promise.race([loadPromise, timeoutPromise]);
        
        if (isMounted) {
          console.log(`✓ InvitesPage: ${list.length} convites carregados`);
          setInvites(list);
        }
      } catch (err) {
        console.error("❌ InvitesPage: Erro:", err.message);
        if (isMounted) {
          setError("Erro ao carregar convites: " + err.message);
        }
      } finally {
        if (isMounted) {
          console.log("✓ InvitesPage: Carregamento concluído");
          setLoading(false);
        }
      }
    }

    load();

    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  async function handle(eventId, status) {
    try {
      setResponding(eventId);
      console.log(`💬 Respondendo: ${eventId} = ${status}`);
      
      const response = await fetch("https://api-5yqejumh5a-uc.a.run.app/invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          eventId,
          status,
        }),
      });

      const data = await response.json();
      console.log("✓ Resposta da API:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao responder convite");
      }

      console.log(`✓ Resposta registrada`);
      setInvites((prev) =>
        prev.filter((i) => i.eventId !== eventId)
      );
    } catch (err) {
      console.error("❌ Erro ao responder:", err);
      alert("Erro: " + err.message);
    } finally {
      setResponding(null);
    }
  }

  return (
    <AppShell active="invites">
      <h1>Convites</h1>

      {error && (
        <div className="card card-pad" style={{ backgroundColor: "#ffebee", borderLeft: "4px solid #ff4444" }}>
          <p style={{ color: "#d32f2f", margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div className="card card-pad">
          <p>⏳ A carregar convites...</p>
          <p style={{ fontSize: "0.85em", color: "#999" }}>Se demorar mais de 15 segundos, algo está errado. Recarrega a página.</p>
        </div>
      )}

      {!loading && invites.length === 0 && (
        <p>✓ Não tens convites pendentes.</p>
      )}

      {!loading && invites.map((i) => (
        <div key={i.eventId} className="card card-pad" style={{ borderLeft: "4px solid #4CAF50" }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#666" }}>
              📧 Convite de: <strong>{i.organizerName}</strong>
            </p>
            <h3 style={{ margin: "4px 0 8px 0", fontSize: 18 }}>
              {i.eventTitle}
            </h3>
            {i.eventDate && (
              <p style={{ margin: "0 0 8px 0", fontSize: 14, color: "#666" }}>
                🕐 {i.eventDate}
              </p>
            )}
            {i.eventDesc && (
              <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#555" }}>
                {i.eventDesc}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => handle(i.eventId, "accepted")}
              disabled={responding === i.eventId}
            >
              {responding === i.eventId ? "A processar…" : "✓ Aceitar"}
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={() => handle(i.eventId, "rejected")}
              disabled={responding === i.eventId}
            >
              {responding === i.eventId ? "A processar…" : "✕ Rejeitar"}
            </button>
          </div>
        </div>
      ))}
    </AppShell>
  );
}
