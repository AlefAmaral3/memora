import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import AppShell from "../components/AppShell";

function initials(nameOrEmail) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 1).toUpperCase();
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      if (!u) navigate("/login", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  const displayName = useMemo(() => {
    return user?.displayName || user?.email?.split("@")[0] || "Utilizador";
  }, [user]);

  const avatarText = useMemo(() => initials(user?.displayName || user?.email), [user]);

  if (!ready) {
    return (
      <div style={{ padding: 40 }}>
        A carregar…
      </div>
    );
  }

  return (
    <AppShell active="events">
      <div style={{ maxWidth: 900 }}>
        <h1 className="h1">Bem-vindo, {displayName}</h1>
        <p className="sub">
          A tua conta está pronta. Podes começar já a criar e gerir os teus eventos no Memora.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 16, marginTop: 18 }}>
          {/* Card principal */}
          <div className="card card-pad" role="region" aria-label="Atalhos principais">
            <h3 className="card-title" style={{ fontSize: 16 }}>Começar</h3>
            <div className="hr" />

            <p className="sub" style={{ marginTop: 0 }}>
              Aceda rapidamente às principais ações. Todos os eventos ficam associados à tua conta.
            </p>

            <div className="actions" style={{ justifyContent: "flex-start", marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/events")}
              >
                Ir para Eventos
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/create-event")}
              >
                Criar evento
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/calendar")}
              >
                Ver Calendário
              </button>
            </div>
          </div>

          {/* Card lateral */}
          <div className="card card-pad" role="region" aria-label="Resumo da conta">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar" aria-label="Avatar do utilizador" style={{ width: 44, height: 44, fontSize: 14 }}>
                {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : avatarText}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "rgba(17,24,39,.90)" }}>
                  {user?.displayName || "Conta Memora"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(17,24,39,.60)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || "—"}
                </div>
              </div>
            </div>

            <div className="hr" />

            <div className="kv">
              <div className="kv-row">
                <span>Estado</span>
                <b>Ativo</b>
              </div>
              <div className="kv-row">
                <span>Plano</span>
                <b>Académico</b>
              </div>
              <div className="kv-row">
                <span>Segurança</span>
                <b>Google Login</b>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/settings")}
              >
                Definições
              </button>
            </div>

            <p className="help" style={{ marginTop: 10 }}>
              Dica: cria o teu primeiro evento e usa “Editar” para testar o fluxo completo.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
