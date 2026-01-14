import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { GooglePlacesAutocomplete } from "../components/GooglePlacesAutocomplete";
import { auth } from "../firebase/firebaseConfig";
import { db } from "../firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

const CATEGORIAS = ["Reunião", "Aula", "Aniversário", "Outro"];

function toDateOnlyTimestamp(yyyyMMdd) {
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  return Timestamp.fromDate(d);
}

function toStartAtTimestamp(yyyyMMdd, hhmm) {
  const d = new Date(`${yyyyMMdd}T${hhmm || "00:00"}`);
  return Timestamp.fromDate(d);
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

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
  const [saving, setSaving] = useState(false);

  const resumo = useMemo(() => {
    return {
      titulo: titulo || "—",
      data: data || "—",
      hora: hora || "—",
      local: local || "—",
      categoria: categoria || "—",
      visibilidade: visibilidade ? "Público" : "Privado",
    };
  }, [titulo, data, hora, local, categoria, visibilidade]);

  function toggleReminder(key) {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert("Sessão inválida. Faz login novamente.");
      navigate("/login");
      return;
    }

    if (!titulo || !data || !hora) {
      alert("Preenche pelo menos: Título, Data e Hora.");
      return;
    }

    try {
      setSaving(true);

      const reminderList = Object.entries(reminders)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await addDoc(collection(db, "events"), {
        ownerId: user.uid,
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
        status: "active",
        startAt: toStartAtTimestamp(data, hora),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/events");
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      alert("Erro ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell active="events">
      <h1 className="h1">Criar evento</h1>
      <p className="sub">Preenche os dados para criar um novo evento.</p>

      <div className="grid-2col">
        {/* Card principal */}
        <form className="card card-pad" onSubmit={onSubmit} aria-label="Formulário de criação">
          <div className="form-grid" style={{ marginTop: 6 }}>
            <div className="field row-span-2">
              <label className="label" htmlFor="titulo">Título do evento</label>
              <input id="titulo" className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Reunião de Projeto — Memora" />
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
                  // Se digitar livremente (sem selecionar do autocomplete), mantém texto mas limpa coords
                  // As coords só são definidas quando seleciona do autocomplete
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
              <textarea id="descricao" className="textarea" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Escreve um resumo do evento…" />
            </div>

            <div className="field row-span-2">
              <div className="toggle" role="group" aria-label="Visibilidade">
                <div className="toggle-left">
                  <span className="label" style={{ margin: 0 }}>Evento público</span>
                  <span className="help">Este evento será visível para todos.</span>
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

          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/events")}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "A criar…" : "Criar evento"}
            </button>
          </div>
        </form>

        {/* Painel lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card card-pad" aria-label="Resumo">
            <h3 className="card-title">Resumo</h3>
            <div className="hr" />
            <div className="kv">
              <div className="kv-row"><span>Título</span><b>{resumo.titulo}</b></div>
              <div className="kv-row"><span>Data</span><b>{resumo.data}</b></div>
              <div className="kv-row"><span>Hora</span><b>{resumo.hora}</b></div>
              <div className="kv-row"><span>Local</span><b>{resumo.local}</b></div>
              <div className="kv-row"><span>Categoria</span><b>{resumo.categoria}</b></div>
              <div className="kv-row"><span>Visibilidade</span><b>{resumo.visibilidade}</b></div>
            </div>
          </div>

          <div className="card card-pad" aria-label="Lembretes">
            <h3 className="card-title">Lembretes</h3>
            <div className="hr" />
            {Object.keys(reminders).map((k) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(17,24,39,.75)", padding: "6px 2px" }}>
                <input type="checkbox" checked={reminders[k]} onChange={() => toggleReminder(k)} />
                {k} antes
              </label>
            ))}
            <p className="help" style={{ marginTop: 8 }}>Podes alterar mais tarde.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
