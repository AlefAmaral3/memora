import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { db, auth, storage } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

import { getParticipants } from "../services/getParticipants";
import { addParticipant } from "../services/addParticipant";
import { addParticipantByEmail } from "../services/addParticipantByEmail";
import { searchUsers } from "../services/searchUsers";

/* ===================== helpers ===================== */

function fmtLine(ev) {
  const d = ev?.data?.toDate
    ? ev.data.toDate().toLocaleDateString("pt-PT")
    : "—";
  return `${d} · ${ev?.hora || "—"} · ${ev?.local || "—"}`;
}

function initials(name) {
  return name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";
}

/* ===================== page ===================== */

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ev, setEv] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const isOwner = ev?.ownerId === auth.currentUser?.uid;

  // Verificar se é participante aceito
  const isAcceptedParticipant = participants.some(
    (p) => p.uid === auth.currentUser?.uid && p.status === "accepted"
  );

  // Pode fazer upload se é proprietário OU participante aceito
  const canUploadPhotos = isOwner || isAcceptedParticipant;

  /* ===================== load ===================== */

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "events", id));
      if (!snap.exists()) {
        alert("Evento não encontrado.");
        navigate("/events");
        return;
      }

      setEv({ id: snap.id, ...snap.data() });
      setParticipants(await getParticipants(id));
      
      // Carregar fotos do Storage
      try {
        const photosRef = ref(storage, `events/${id}/photos`);
        const photosList = await listAll(photosRef);
        const urls = await Promise.all(
          photosList.items.map(async (item) => ({
            name: item.name,
            url: await getDownloadURL(item),
          }))
        );
        setPhotos(urls);
      } catch (e) {
        console.log("Sem fotos ou erro ao carregar:", e);
      }
      
      setLoading(false);
    }

    load();
  }, [id, navigate]);

  // Atualizar participantes a cada 10 segundos para ver status em tempo real
  useEffect(() => {
    if (!loading && isOwner) {
      const interval = setInterval(async () => {
        setParticipants(await getParticipants(id));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loading, isOwner, id]);

  /* ===================== search ===================== */

  useEffect(() => {
    async function runSearch() {
      console.log(`🔍 Procurando: "${search}"`);
      const res = await searchUsers(search);
      console.log(`📋 Resultados (${res.length}):`, res);
      setResults(res);
    }

    runSearch();
  }, [search]);

  /* ===================== actions ===================== */

  async function inviteUser(user) {
    console.log("🎯 inviteUser chamada com:", user);
    
    if (!user) {
      alert("Utilizador inválido");
      return;
    }

    setBusy(true);
    try {
      // Se é convite por email (isEmailInvite)
      if (user.isEmailInvite) {
        console.log("📧 Convite por EMAIL:", user.email);
        if (!user.email || !user.email.includes("@")) {
          alert("Email inválido");
          setBusy(false);
          return;
        }
        await addParticipantByEmail(id, user.email);
        alert(`Convite enviado para ${user.email}`);
      } else {
        // Convite para utilizador registado
        console.log("👤 Convite por NOME (uid):", user.uid);
        if (!user.uid) {
          alert("Utilizador inválido (sem uid)");
          setBusy(false);
          return;
        }
        await addParticipant({ eventId: id, userId: user.uid });
        alert(`Convite enviado para ${user.displayName}`);
      }
      setParticipants(await getParticipants(id));
      setSearch("");
      setResults([]);
    } catch (error) {
      console.error("❌ Erro ao convidar:", error);
      alert("Erro: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent() {
    if (!window.confirm("Eliminar evento?")) return;

    setBusy(true);

    const snap = await getDocs(collection(db, "events", id, "participants"));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    await deleteDoc(doc(db, "events", id));
    navigate("/events");
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const photoRef = ref(storage, `events/${id}/photos/${fileName}`);
        
        // Adicionar metadata para rastreio
        const metadata = {
          customMetadata: {
            uploadedBy: auth.currentUser.uid,
            eventId: id,
          },
        };
        
        await uploadBytes(photoRef, file, metadata);
        const url = await getDownloadURL(photoRef);
        return { name: fileName, url };
      });

      const newPhotos = await Promise.all(uploadPromises);
      setPhotos((prev) => [...prev, ...newPhotos]);
      
      // Atualizar Firestore com URLs
      await updateDoc(doc(db, "events", id), {
        photos: arrayUnion(...newPhotos.map((p) => p.url)),
        updatedAt: serverTimestamp(),
      });
      
      alert("Fotos enviadas com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar fotos:", error);
      alert("Erro ao enviar fotos.");
    } finally {
      setUploading(false);
    }
  }

  /* ===================== render ===================== */

  if (loading) {
    return <AppShell active="events">A carregar…</AppShell>;
  }

  return (
    <AppShell active="events">
      <h1>{ev.titulo}</h1>
      <p>{fmtLine(ev)}</p>

      {/* Botão para abrir no Maps */}
      {(ev.latitude && ev.longitude) || ev.local ? (
        <div style={{ marginBottom: 18 }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (ev.latitude && ev.longitude) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${ev.latitude},${ev.longitude}`, "_blank");
              } else if (ev.local) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.local)}`, "_blank");
              }
            }}
          >
            📍 Abrir no Maps
          </button>
        </div>
      ) : null}

      <div className="card card-pad">
        <h3>Participantes</h3>

        <input
          className="input"
          placeholder="Pesquisar utilizador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isOwner && (
          <button onClick={() => setSearch("")} className="btn btn-secondary">
            + Convidar
          </button>
        )}

        {results.map((u) => (
          <div key={u.uid || u.email} className="pill">
            {u.displayName}
            {u.isEmailInvite && <span style={{ fontSize: "0.85em", color: "#999" }}> (email)</span>}
            <button onClick={() => inviteUser(u)}>Convidar</button>
          </div>
        ))}

        {search && search.length >= 2 && results.length === 0 && (
          <p style={{ color: "#999", fontSize: "0.9em", marginTop: "10px" }}>
            Nenhum utilizador encontrado para "{search}"
          </p>
        )}

        <hr />

        {participants.map((p) => (
          <span key={p.uid} className="pill" style={{ 
            backgroundColor: p.status === "accepted" ? "#e8f5e9" : 
                            p.status === "rejected" ? "#ffebee" : "#fff3e0",
            borderLeft: `4px solid ${p.status === "accepted" ? "#4CAF50" : 
                                     p.status === "rejected" ? "#ff4444" : "#ff9800"}`
          }}>
            <span className="avatar">{initials(p.displayName)}</span>
            <span>
              {p.displayName}
              {p.status === "pending" && <span style={{ fontSize: "0.85em", color: "#ff9800" }}> ⏳ pendente</span>}
              {p.status === "accepted" && <span style={{ fontSize: "0.85em", color: "#4CAF50" }}> ✓ aceito</span>}
              {p.status === "rejected" && <span style={{ fontSize: "0.85em", color: "#ff4444" }}> ✕ rejeitado</span>}
            </span>
          </span>
        ))}
      </div>

      {/* Galeria de Fotos */}
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3>Fotografias</h3>
        
        {canUploadPhotos && (
          <div style={{ marginBottom: 16 }}>
            <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
              {uploading ? "A enviar…" : "📷 Adicionar fotos"}
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
        
        {photos.length === 0 && (
          <p className="sub">Sem fotografias por agora.</p>
        )}
        
        <div className="photo-grid">
          {photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo.url}
              alt={`Foto ${idx + 1}`}
              className="photo-item"
            />
          ))}
        </div>
      </div>

      {isOwner && (
        <button className="btn btn-danger" onClick={deleteEvent} disabled={busy}>
          Eliminar evento
        </button>
      )}
    </AppShell>
  );
}
