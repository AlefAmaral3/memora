import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function logout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <AppShell active="settings">
      <h1 className="h1">Definições</h1>
      <p className="sub">Preferências e conta.</p>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 className="card-title">Conta</h3>
        <div className="hr" />
        <p className="sub" style={{ margin: 0 }}>
          <b>Email:</b> {user?.email || "—"}
        </p>

        <div style={{ marginTop: 14 }}>
          <button className="btn btn-danger" type="button" onClick={logout}>
            Terminar sessão
          </button>
        </div>
      </div>
    </AppShell>
  );
}
