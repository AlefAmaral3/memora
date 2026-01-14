import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { GooglePlacesAutocomplete } from "../components/GooglePlacesAutocomplete";
import { auth, db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const CATEGORIAS = ["Reunião", "Aula", "Aniversário", "Outro"];

function toDateOnlyTimestamp(yyyyMMdd) {
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  return Timestamp.fromDate(d);
}
function toStartAtTimestamp(yyyyMMdd, hhmm) {
  const d = new Date(`${yyyyMMdd}T${hhmm || "00:00"}`);
  return Timestamp.fromDate(d);
}

function isoDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function relTime(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : null;
    if (!d) return "—";
    const diff = Date.now() - d.getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `há ${hrs} horas`;
    const days = Math.round(hrs / 24);
    return `há ${days} dias`;
  } catch {
    return "—";
  }
}

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [visibilidade, setVisibilidade] = useState(true);
  const [categoria, setCategoria] = useState("Reunião");
  const [reminders, setReminders] = useState({
    "10 min": true,
    "1 hora": false,
    "1 dia": false,
  });

  const [updatedAt, setUpdatedAt] = useState(null);

  const initialRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "events", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Evento não encontrado.");
          navigate("/events");
          return;
        }

        const ev = snap.data();

        setTitulo(ev.titulo || "");
        setData(isoDate(ev.data));
        setHora(ev.hora || "");
        setLocal(ev.local || "");
        setDescricao(ev.descricao || "");
        setVisibilidade(!!ev.visibilidade);
        setCategoria(ev.categoria || "Reunião");
        setLatitude(ev.latitude ?? null);
        setLongitude(ev.longitude ?? null);

        const list = Array.isArray(ev.reminders) ? ev.reminders : [];
        setReminders({
          "10 min": list.includes("10 min"),
          "1 hora": list.includes("1 hora"),
          "1 dia": list.includes("1 dia"),
        });

        setUpdatedAt(ev.updatedAt || ev.createdAt || null);

        initialRef.current = {
          titulo: ev.titulo || "",
          data: isoDate(ev.data),
          hora: ev.hora || "",
          local: ev.local || "",
          descricao: ev.descricao || "",
          visibilidade: !!ev.visibilidade,
          categoria: ev.categoria || "Reunião",
          reminders: list.slice().sort().join("|"),
          latitude: ev.latitude ?? null,
          longitude: ev.longitude ?? null,
        };
      } catch (e) {
        console.error("Erro ao carregar evento:", e);
        alert("Erro ao carregar evento.");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  function toggleReminder(key) {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const reminderList = useMemo(() => {
    return Object.entries(reminders).filter(([, v]) => v).map(([k]) => k);
  }, [reminders]);

  const dirty = useMemo(() => {
    if (!initialRef.current) return false;
    const now = {
      titulo,
      data,
      hora,
      local,
      descricao,
      visibilidade,
      categoria,
      reminders: reminderList.slice().sort().join("|"),
    };
    return Object.keys(now).some((k) => String(now[k]) !== String(initialRef.current[k]));
  }, [titulo, data, hora, local, descricao, visibilidade, categoria, reminderList, latitude, longitude]);

  async function onSave(e) {
    e.preventDefault();
    if (!titulo || !data || !hora) {
      alert("Preenche pelo menos: Título, Data e Hora.");
      return;
    }

    try {
      setSaving(true);

      // Preparar updates
      const updates = {
        titulo,
        data: toDateOnlyTimestamp(data),
        hora,
        local,
        latitude,
        longitude,
        descricao,
        visibilidade,
        categoria,
        reminders: reminderList,
        startAt: toStartAtTimestamp(data, hora),
      };

      // Usar Cloud Function para atualizar
      const functionUrl = `https://us-central1-memora-dbba3.cloudfunctions.net/updateEvent`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": auth.currentUser?.uid || "",
        },
        body: JSON.stringify({ eventId: id, updates }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro desconhecido");
      }

      navigate(`/events/${id}`);
    } catch (e) {
      console.error("Erro ao guardar alterações:", e);
      alert("Erro ao guardar alterações: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Tens a certeza que queres eliminar este evento?");
    if (!ok) return;

    try {
      // Usar Cloud Function para deletar
      const functionUrl = `https://us-central1-memora-dbba3.cloudfunctions.net/deleteEvent`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": auth.currentUser?.uid || "",
        },
        body: JSON.stringify({ eventId: id }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro desconhecido");
      }

      navigate("/events");
    } catch (e) {
      console.error("Erro ao eliminar:", e);
      alert("Erro ao eliminar evento: " + e.message);
    }
  }

  function onDiscard() {
    if (!initialRef.current) return;
    setTitulo(initialRef.current.titulo);
    setData(initialRef.current.data);
    setHora(initialRef.current.hora);
    setLocal(initialRef.current.local);
    setDescricao(initialRef.current.descricao);
    setVisibilidade(initialRef.current.visibilidade);
    setCategoria(initialRef.current.categoria);
    setLatitude(initialRef.current.latitude);
    setLongitude(initialRef.current.longitude);

    const list = (initialRef.current.reminders || "").split("|").filter(Boolean);
    setReminders({
      "10 min": list.includes("10 min"),
      "1 hora": list.includes("1 hora"),
      "1 dia": list.includes("1 dia"),
    });
  }

  return (
    <AppShell active="events">
      <div className="breadcrumb" aria-label="Breadcrumb">
        <b style={{ color: "rgba(17,24,39,.75)" }}>Eventos</b> <span>/</span> <span>Detalhes</span> <span>/</span> <span>Editar</span>
      </div>

      <h1 className="h1">Editar evento</h1>
      <p className="sub">Atualiza os dados do evento e guarda as alterações.</p>

      {loading ? (
        <p className="sub" style={{ marginTop: 18 }}>A carregar…</p>
      ) : (
        <div className="grid-2col">
          <form className="card card-pad" onSubmit={onSave} aria-label="Formulário de edição">
            {dirty && (
              <div className="banner" role="status" aria-label="Alterações não guardadas">
                ⚠️ Alterações não guardadas
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(17,24,39,.60)" }}>
              Última atualização: <b style={{ color: "rgba(17,24,39,.75)" }}>{relTime(updatedAt)}</b>
            </div>

            <div className="form-grid" style={{ marginTop: 14 }}>
              <div className="field row-span-2">
                <label className="label" htmlFor="titulo">Título do evento</label>
                <input id="titulo" className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>

              <div className="field">
                <label className="label" htmlFor="data">Data</label>
                <input id="data" className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>

              <div className="field">
                <label className="label" htmlFor="hora">Hora</label>
                <input id="hora" className="input" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>

              <div className="field row-span-2">
                <label className="label" htmlFor="local">Local</label>
                <GooglePlacesAutocomplete
                  value={local}
                  onChange={(text) => {
                    setLocal(text);
                    // Permite digitar livremente sem limpar coords (só limpa se mudar muito)
                  }}
                  onSelect={(place) => {
                    setLocal(place.description);
                    setLatitude(place.lat);
                    setLongitude(place.lng);
                  }}
                  placeholder="Ex.: Lisboa, Sala 3, Academia da Bola..."
                />
              </div>

              <div className="field row-span-2">
                <label className="label" htmlFor="categoria">Categoria</label>
                <select id="categoria" className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field row-span-2">
                <label className="label" htmlFor="descricao">Descrição</label>
                <textarea id="descricao" className="textarea" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>

              <div className="field row-span-2">
                <div className="toggle">
                  <div className="toggle-left">
                    <span className="label" style={{ margin: 0 }}>Evento público</span>
                    <span className="help">Controla a visibilidade do evento.</span>
                  </div>

                  <button
                    type="button"
                    className="switch"
                    data-on={visibilidade ? "true" : "false"}
                    aria-pressed={visibilidade}
                    onClick={() => setVisibilidade((v) => !v)}
                  >
                    <span className="knob" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="hr" />

            <div className="actions" style={{ justifyContent: "space-between" }}>
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                🗑️ Eliminar evento
              </button>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={onDiscard}>
                  Descartar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "A guardar…" : "Guardar alterações"}
                </button>
              </div>
            </div>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card card-pad">
              <h3 className="card-title">Resumo</h3>
              <div className="hr" />
              <div className="kv">
                <div className="kv-row"><span>Título</span><b>{titulo || "—"}</b></div>
                <div className="kv-row"><span>Data</span><b>{data || "—"}</b></div>
                <div className="kv-row"><span>Hora</span><b>{hora || "—"}</b></div>
                <div className="kv-row"><span>Local</span><b>{local || "—"}</b></div>
                <div className="kv-row"><span>Categoria</span><b>{categoria || "—"}</b></div>
              </div>
            </div>

            <div className="card card-pad">
              <h3 className="card-title">Lembretes</h3>
              <div className="hr" />
              {["10 min", "1 hora", "1 dia"].map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(17,24,39,.75)", padding: "6px 2px" }}>
                  <input type="checkbox" checked={!!reminders[k]} onChange={() => toggleReminder(k)} />
                  {k} antes
                </label>
              ))}
              <p className="help" style={{ marginTop: 8 }}>Podes alterar mais tarde.</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
