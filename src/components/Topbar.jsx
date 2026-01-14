import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { getMyInvites } from "../services/getMyInvites";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function Topbar({ active }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [open, setOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const ref = useRef(null);

  async function loadInvites() {
    try {
      if (auth.currentUser) {
        const invites = await getMyInvites();
        setInviteCount(invites.length);
      }
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadInvites();
      } else {
        setInviteCount(0);
      }
    });
    return () => unsub();
  }, []);

  // Carregar convites uma vez quando o utilizador se autentica
  // Não atualizar constantemente para não sobrecarregar Firestore

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initial = useMemo(() => {
    const name = user?.displayName || user?.email || "U";
    return name.trim().slice(0, 1).toUpperCase();
  }, [user]);

  async function doLogout() {
    await signOut(auth);
    setOpen(false);
    navigate("/login");
  }

  return (
    <div className="topbar" role="banner">
      <div className="topbar-inner">
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="brand"
          aria-label="Ir para Eventos"
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
        >
          <span className="brand-dot" aria-hidden="true" />
          Memora
        </button>

        <nav className="nav" aria-label="Navegação principal">
          <NavLink to="/events" className={({ isActive }) => (isActive || active === "events" ? "active" : "")}>
            Eventos
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => (isActive || active === "calendar" ? "active" : "")}>
            Calendário
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => (isActive || active === "map" ? "active" : "") }>
            Mapa
          </NavLink>
          {/* Rota de teste removida; Mapa padrão em /map */}
          <NavLink to="/invites" className={({ isActive }) => (isActive || active === "invites" ? "active" : "")}
            style={{ position: "relative" }}
          >
            Convites
            {inviteCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-8px",
                right: "-12px",
                backgroundColor: "#ff4444",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                {inviteCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive || active === "settings" ? "active" : "")}>
            Definições
          </NavLink>
        </nav>

        <div className="user-area">
          <div className="avatar" aria-label="Avatar do utilizador">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : initial}
          </div>

          <div className="dropdown" ref={ref}>
            <button
              type="button"
              className="icon-btn"
              aria-label="Abrir menu do utilizador"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon />
            </button>

            {open && (
              <div className="dropdown-panel" role="menu" aria-label="Menu do utilizador">
                <div className="dropdown-email" title={user?.email || ""}>
                  {user?.email || "Sessão ativa"}
                </div>

                <div className="dropdown-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => { setOpen(false); navigate("/settings"); }}>
                    Definições
                  </button>
                  <button className="btn btn-danger" type="button" onClick={doLogout}>
                    Terminar sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
