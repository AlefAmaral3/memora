import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth } from "../firebase/firebaseConfig";
import { db } from "../firebase/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";

function SearchIcon() {
  return (
    <svg className="search-ic" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function toDateObj(ts) {
  try {
    if (!ts) return null;
    if (typeof ts === "object" && typeof ts.toDate === "function") {
      return ts.toDate();
    }
    const seconds = ts?.seconds ?? ts?._seconds;
    if (typeof seconds === "number") {
      const d = new Date(seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function fmtDate(ts) {
  const d = toDateObj(ts);
  return d ? d.toLocaleDateString("pt-PT") : "—";
}

function getStart(tsData, hora) {
  const d = toDateObj(tsData);
  if (!d) return null;
  const [hh, mm] = (hora || "00:00").split(":").map((x) => parseInt(x, 10));
  const dd = new Date(d);
  dd.setHours(hh || 0, mm || 0, 0, 0);
  return dd.getTime();
}

export default function EventsPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  useEffect(() => {
    if (!user) return;

    async function loadEvents() {
      try {
        console.log("📋 EventsPage: Carregando eventos via API");
        
        const response = await fetch(
          `https://api-5yqejumh5a-uc.a.run.app/events/my?uid=${encodeURIComponent(user.uid)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const result = await response.json();
        console.log("✓ EventsPage: Dados recebidos:", result);

        if (!response.ok) {
          throw new Error(result.error || "Erro ao carregar eventos");
        }

        const data = result.events || [];
        
        // Ordenar client-side
        data.sort((a, b) => {
          const aa = getStart(a.data, a.hora) ?? 0;
          const bb = getStart(b.data, b.hora) ?? 0;
          return aa - bb;
        });

        console.log(`✓ EventsPage: ${data.length} eventos carregados`);
        setEvents(data);
      } catch (e) {
        console.error("❌ EventsPage: Erro ao carregar eventos:", e);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [user]);

  async function handleDelete(eventId) {
    const ok = window.confirm("Tens a certeza que queres eliminar este evento?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e) {
      console.error("Erro ao apagar evento:", e);
      alert("Erro ao apagar evento.");
    }
  }

  const filtered = useMemo(() => {
    const t = qtext.trim().toLowerCase();
    if (!t) return events;
    return events.filter((e) => {
      const hay = `${e.titulo || ""} ${e.local || ""} ${e.categoria || ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [events, qtext]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filtered.slice(indexOfFirstEvent, indexOfLastEvent);

  function goToPage(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AppShell active="events">
      <div>
        <h1 className="h1">Meus Eventos</h1>
        <p className="sub">Aqui estão os teus eventos agendados.</p>

        <div className="search" role="search" aria-label="Pesquisar eventos">
          <div className="search-wrap">
            <SearchIcon />
            <input
              className="input"
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Pesquisar eventos…"
              aria-label="Pesquisar"
            />
          </div>

          <button className="btn btn-primary" type="button" onClick={() => navigate("/create-event")}>
            + Criar evento
          </button>
        </div>

        {loading && <p className="sub" style={{ marginTop: 24 }}>A carregar eventos…</p>}

        {!loading && filtered.length === 0 && (
          <div className="card card-pad" style={{ marginTop: 18, textAlign: "center" }}>
            <h3 className="card-title" style={{ fontSize: 16, marginBottom: 8 }}>Sem eventos por agora</h3>
            <p className="sub">Quando criares eventos, eles vão aparecer aqui.</p>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="button" onClick={() => navigate("/create-event")}>
                + Criar evento
              </button>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="list" aria-label="Lista de eventos">
              {currentEvents.map((ev) => (
                <div key={ev.id} className="card event-item">
                  <div 
                    className="event-main"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/events/${ev.id}`)}
                  >
                    <h3 className="event-title">{ev.titulo || "Sem título"}</h3>
                    <p className="event-meta">
                      {fmtDate(ev.data)} · {ev.hora || "—"}
                      {ev.local ? ` · ${ev.local}` : ""}
                      {ev.categoria ? ` · ${ev.categoria}` : ""}
                    </p>
                  </div>

                  <div className="event-actions">
                    <span className={`pill ${ev.visibilidade ? "pill-public" : "pill-private"}`}>
                      {ev.visibilidade ? "Público" : "Privado"}
                    </span>

                    <button className="icon-btn" type="button" aria-label="Editar" onClick={() => navigate(`/events/${ev.id}/edit`)}>
                      ✏️
                    </button>

                    <button className="icon-btn" type="button" aria-label="Eliminar" onClick={() => handleDelete(ev.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>

                <span style={{ padding: "0 16px", color: "var(--muted)", fontSize: 14 }}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  className="btn btn-secondary"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próximo →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
