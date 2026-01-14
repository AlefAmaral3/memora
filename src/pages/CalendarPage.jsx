import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Dom, 1=Seg, ...
}

function fmtDate(ts) {
  try {
    return ts?.toDate ? ts.toDate().toLocaleDateString("pt-PT") : "—";
  } catch {
    return "—";
  }
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month"); // month, week, day

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!user) return;

    async function loadEvents() {
      try {
        const startOfMonth = Timestamp.fromDate(new Date(year, month, 1, 0, 0, 0));
        const endOfMonth = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59));

        const q = query(
          collection(db, "events"),
          where("ownerId", "==", user.uid),
          where("data", ">=", startOfMonth),
          where("data", "<=", endOfMonth)
        );

        const snap = await getDocs(q);
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erro ao carregar eventos:", e);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [user, year, month]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setLoading(true);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setLoading(true);
  }

  function getEventsForDay(day) {
    return events.filter((e) => {
      const d = e.data?.toDate?.();
      return d && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // espaços vazios
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <AppShell active="calendar">
      <div>
        <h1 className="h1">Calendário</h1>
        <p className="sub">Visão dos teus eventos.</p>

        <div style={{ marginTop: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className={`btn ${view === "month" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("month")}
          >
            Mês
          </button>
          <button
            className={`btn ${view === "week" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("week")}
          >
            Semana
          </button>
          <button
            className={`btn ${view === "day" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("day")}
          >
            Dia
          </button>
        </div>

        <div style={{ marginTop: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-secondary" onClick={prevMonth}>
            ← Anterior
          </button>
          <h2 style={{ flex: 1, textAlign: "center", textTransform: "capitalize", margin: 0 }}>
            {view === "month" && monthName}
            {view === "week" && `Semana - ${monthName}`}
            {view === "day" && currentDate.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
          </h2>
          <button className="btn btn-secondary" onClick={nextMonth}>
            Próximo →
          </button>
        </div>

        {loading && <p className="sub">A carregar…</p>}

        {!loading && view === "month" && (
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="calendar-day-header">
                {d}
              </div>
            ))}

            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="calendar-day calendar-day-empty" />;
              }

              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div key={day} className={`calendar-day ${isToday ? "calendar-day-today" : ""}`}>
                  <div className="calendar-day-number">{day}</div>
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="calendar-event"
                      onClick={() => navigate(`/events/${ev.id}`)}
                      title={`${ev.titulo} - ${ev.hora || ""}`}
                    >
                      {ev.titulo || "Sem título"}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!loading && view === "week" && (
          <div className="card card-pad">
            <h3>Vista Semanal</h3>
            <p className="sub">Eventos desta semana:</p>
            {events
              .filter((e) => {
                const d = e.data?.toDate?.();
                if (!d) return false;
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return d >= weekStart && d <= weekEnd;
              })
              .map((ev) => (
                <div
                  key={ev.id}
                  className="event-item card"
                  style={{ marginTop: 8, cursor: "pointer" }}
                  onClick={() => navigate(`/events/${ev.id}`)}
                >
                  <h4>{ev.titulo}</h4>
                  <p className="sub">
                    {fmtDate(ev.data)} · {ev.hora} · {ev.local || "—"}
                  </p>
                </div>
              ))}
          </div>
        )}

        {!loading && view === "day" && (
          <div className="card card-pad">
            <h3>Vista Diária</h3>
            <p className="sub">Eventos de {currentDate.toLocaleDateString("pt-PT")}:</p>
            {events
              .filter((e) => {
                const d = e.data?.toDate?.();
                if (!d) return false;
                return (
                  d.getDate() === currentDate.getDate() &&
                  d.getMonth() === currentDate.getMonth() &&
                  d.getFullYear() === currentDate.getFullYear()
                );
              })
              .map((ev) => (
                <div
                  key={ev.id}
                  className="event-item card"
                  style={{ marginTop: 8, cursor: "pointer" }}
                  onClick={() => navigate(`/events/${ev.id}`)}
                >
                  <h4>{ev.titulo}</h4>
                  <p className="sub">
                    {ev.hora} · {ev.local || "—"}
                  </p>
                  {ev.descricao && <p>{ev.descricao}</p>}
                </div>
              ))}
            {events.filter((e) => {
              const d = e.data?.toDate?.();
              return d && d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            }).length === 0 && <p className="sub">Sem eventos para este dia.</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
