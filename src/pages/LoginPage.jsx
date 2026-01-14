import "./LoginPage.css";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { requestUserForPush } from "../firebase/messaging";
import { saveUser } from "../services/saveUser";
import { useNavigate } from "react-router-dom";

import googleIcon from "../assets/google.png";

function LoginPage() {
  const navigate = useNavigate();

  async function handleGoogleLogin() {
    try {
      // 🔐 Provider Google
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      // 1️⃣ LOGIN (CRÍTICO)
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2️⃣ Guardar utilizador (CRÍTICO)
      await saveUser(user);

      // 3️⃣ Push Notifications (OPCIONAL — nunca quebra login)
      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          await requestUserForPush();

          new Notification(`${user.displayName} fez login`, {
            body: "Login realizado com sucesso!",
            icon: "/logo192.png",
          });
        }
      } catch (pushError) {
        console.warn("Push notifications falharam:", pushError);
        // ❗ Ignorado de propósito
      }

      // 4️⃣ Navegação FINAL
      navigate("/events");
    } catch (error) {
      console.error("Erro ao realizar login com Google:", error);
      alert("Erro ao realizar login com Google");
    }
  }

  return (
    <div className="login-page">
      {/* HEADER */}
      <header className="login-header">
        <div className="login-header-inner">
          <button
            type="button"
            className="login-logo login-logo-btn"
            onClick={() => navigate("/")}
            aria-label="Ir para a página inicial"
          >
            Memora
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="login-main">
        <div className="login-card" role="region" aria-label="Área de login">
          <div className="login-card-head">
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">
              Entra rapidamente para gerir os teus eventos.
            </p>
          </div>

          <div className="login-divider" aria-hidden="true">
            <span />
            <span className="login-divider-text">Continuar com</span>
            <span />
          </div>

          <div className="login-icons" aria-label="Opções de login">
            <button
              type="button"
              className="social-btn google"
              onClick={handleGoogleLogin}
              aria-label="Continuar com Google"
            >
              <img
                className="social-icon"
                src={googleIcon}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="login-footer" aria-label="Rodapé">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-logo">Memora</div>
            <nav className="footer-nav" aria-label="Links">
              <a href="/">Home</a>
              <a href="/login">Login</a>
            </nav>
          </div>

          <div className="footer-right">
            <select className="footer-lang" aria-label="Idioma">
              <option>Português (Portugal)</option>
            </select>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 Memora. Todos os direitos reservados.</span>
          <div className="footer-bottom-links">
            <a href="#termos">Termos de Serviço</a>
            <a href="#privacidade">Política de Privacidade</a>
            <a href="#acessibilidade">Política de Acessibilidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
