import { Link, useNavigate } from "react-router-dom";
import Topbar from "./Topbar";
import "../styles/memora.css";

export default function AppShell({ active, children }) {
  const navigate = useNavigate();

  return (
    <div className="memora-app">
      <Topbar active={active} />
      <div className="memora-container">{children}</div>

      <footer className="memora-footer-home">
        <div className="footer-home-content">
          <p className="footer-home-copy">© 2025 Memora. Todos os direitos reservados.</p>
          <div className="footer-home-links">
            <button onClick={() => navigate("/terms")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}>Termos de Serviço</button>
            <button onClick={() => navigate("/privacy")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}>Política de Privacidade</button>
            <a href="mailto:memora.projeto@gmail.com" style={{ color: "inherit", textDecoration: "underline", cursor: "pointer" }}>Contactos: memora.projeto@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
