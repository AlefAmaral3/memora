import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getMyEvents } from "../services/getMyEvents";
import { Link } from "react-router-dom";

export default function MyEventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getMyEvents().then(setEvents);
  }, []);

  return (
    <AppShell active="events">
      <h1>Eventos onde participo</h1>

      {events.length === 0 && <p>Não participas em eventos.</p>}

      {events.map((e) => (
        <Link key={e.eventId} to={`/events/${e.eventId}`}>
          <div className="card card-pad">
            Evento {e.eventId}
          </div>
        </Link>
      ))}
    </AppShell>
  );
}
