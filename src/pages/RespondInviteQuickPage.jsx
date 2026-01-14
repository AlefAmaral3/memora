import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function RespondInviteQuickPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const email = searchParams.get("email");
  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");

  useEffect(() => {
    async function respondQuick() {
      try {
        console.log(`📧 [RespondInvite] Iniciando: email=${email}, eventId=${eventId}, status=${status}`);

        const response = await fetch(
          "https://respondinvitebyemail-5yqejumh5a-uc.a.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, eventId, status }),
          }
        );

        console.log(`✓ [RespondInvite] Status da resposta: ${response.status}`);
        const data = await response.json();
        console.log("✓ [RespondInvite] Dados recebidos:", data);

        if (response.ok) {
          setResult({
            success: true,
            message: data.message,
            eventTitle: data.eventTitle,
          });
        } else {
          setError(data.error || "Erro ao responder convite");
        }
      } catch (err) {
        console.error("❌ [RespondInvite] Erro:", err);
        setError("Erro ao processar resposta: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (email && eventId && status) {
      respondQuick();
    } else {
      console.error("❌ [RespondInvite] Parâmetros inválidos:", { email, eventId, status });
      setError("Parâmetros inválidos na URL");
      setLoading(false);
    }
  }, [email, eventId, status]);

  return (
    <AppShell active="">
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        {loading && (
          <div className="card card-pad">
            <p style={{ fontSize: 24 }}>⏳ A processar resposta...</p>
            <p style={{ color: "#999" }}>Aguarde um momento...</p>
          </div>
        )}

        {!loading && result && (
          <div className="card card-pad" style={{ backgroundColor: "#e8f5e9", borderLeft: "4px solid #4CAF50" }}>
            <p style={{ fontSize: 24, marginTop: 0, color: "#2e7d32" }}>✓ Sucesso!</p>
            <p style={{ fontSize: 18, marginBottom: 10 }}>{result.message}</p>
            <p style={{ color: "#555" }}>
              Evento: <strong>{result.eventTitle}</strong>
            </p>
            <p style={{ color: "#999", fontSize: 12, marginBottom: 20 }}>
              Pode fechar esta página.
            </p>
            <p style={{ color: "#666" }}>
              <a href="/invites" style={{ color: "#667eea", textDecoration: "none" }}>
                ← Voltar aos convites
              </a>
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="card card-pad" style={{ backgroundColor: "#ffebee", borderLeft: "4px solid #ff4444" }}>
            <p style={{ fontSize: 24, marginTop: 0, color: "#c62828" }}>✕ Erro</p>
            <p style={{ fontSize: 16, marginBottom: 10, color: "#d32f2f" }}>{error}</p>
            <p style={{ color: "#666" }}>
              <a href="/invites" style={{ color: "#667eea", textDecoration: "none" }}>
                ← Voltar aos convites
              </a>
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
