import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import cadernoImg from "../assets/caderno.png";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="App">
      {/* HEADER */}
      <header className="memora-header">
        <div className="memora-header-inner">
          <div className="memora-logo">Memora</div>

          <nav className="memora-nav">
            <a href="#sobre">Sobre</a>
            <a href="#contactos">Contactos</a>
            <a href="#funcionalidades">Funcionalidades</a>
          </nav>

          {/* AGORA VAI PARA A PÁGINA /login */}
          <button
            className="memora-login-button"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="memora-main">
        <section className="hero-section">
          <div className="hero-inner">
            <div className="hero-left">
              {/* ERA O RETÂNGULO "Caderno" — AGORA É A IMAGEM */}
              <img
                src={cadernoImg}
                alt="Caderno"
                className="hero-notebook-placeholder"
              />
            </div>

            <div className="hero-right">
              <p className="hero-eyebrow">PRONTO PARA</p>
              <h1 className="hero-title">
                ORGANIZAR <br />
                O TEU EVENTO?
              </h1>
              <p className="hero-subtitle">
                Junta-te a milhares de utilizadores
                <br />
                satisfeitos.
              </p>

              <button
                className="hero-cta-button"
                onClick={() => navigate("/login")}
              >
                Começar Agora
              </button>
            </div>
          </div>
        </section>

        {/* SOBRE NÓS */}
        <section className="about-section" id="sobre">
          <div className="about-inner">
            <h2 className="about-title">Sobre o Memora</h2>
            
            <div className="about-card">
              <p className="about-text">
                O <strong>Memora</strong> é a solução completa para gerir os teus eventos de forma simples e eficiente. 
                Criado para facilitar a organização de reuniões, festas, aulas e qualquer tipo de evento, 
                o Memora permite-te criar eventos, enviar convites, partilhar fotografias e receber lembretes automáticos.
              </p>
              <p className="about-text">
                Com integração ao Google Maps, podes definir localizações precisas para os teus eventos. 
                Os participantes recebem notificações por email e podem aceitar ou rejeitar convites facilmente. 
                Tudo sincronizado na cloud, acessível de qualquer dispositivo - computador, tablet ou telemóvel.
              </p>
            </div>

            <div className="about-features">
              <div className="about-feature">
                <h4>Simples e Intuitivo</h4>
                <p>Interface limpa e fácil de usar</p>
              </div>
              <div className="about-feature">
                <h4>Lembretes Automáticos</h4>
                <p>Nunca mais perca um evento</p>
              </div>
              <div className="about-feature">
                <h4>Partilha de Fotos</h4>
                <p>Guarde memórias em conjunto</p>
              </div>
              <div className="about-feature">
                <h4>Acesso Multiplataforma</h4>
                <p>Use em qualquer dispositivo</p>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="how-section" id="funcionalidades">
          <h2 className="how-title">Veja como Funciona</h2>

          <div className="how-grid">
            <div className="how-card">
              <div className="how-icon calendar-icon">📅</div>
              <h3>Crie o teu evento</h3>
              <p>Escolhe o título, data e local</p>
            </div>

            <div className="how-card">
              <div className="how-icon bell-icon">⏰</div>
              <h3>Define lembranças</h3>
              <p>Recebe avisos automáticos</p>
            </div>

            <div className="how-card">
              <div className="how-icon clock-icon">🕒</div>
              <h3>Gerir facilmente</h3>
              <p>Acompanha e edita seus eventos</p>
            </div>
          </div>
        </section>

        {/* CALENDÁRIO (como estava) */}
        <section className="calendar-section">
          <div className="calendar-card">
            <h3 className="calendar-month">Novembro 2025</h3>

            <table className="calendar-table" cellSpacing="0">
              <thead>
                <tr>
                  <th>SEG</th>
                  <th>TER</th>
                  <th>QUA</th>
                  <th>QUI</th>
                  <th>SEX</th>
                  <th>SÁB</th>
                  <th>DOM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="day">1</td>
                  <td className="day">2</td>
                  <td></td>
                </tr>

                <tr>
                  <td className="day">3</td>
                  <td className="day">5</td>
                  <td className="day">6</td>
                  <td className="day highlight-blue">7</td>
                  <td className="day">8</td>
                  <td className="day">9</td>
                  <td className="day">10</td>
                </tr>

                <tr>
                  <td className="day">11</td>
                  <td className="day highlight-pink">12</td>
                  <td className="day highlight-pink">13</td>
                  <td className="day">14</td>
                  <td className="day">15</td>
                  <td className="day">16</td>
                  <td className="day">17</td>
                </tr>

                <tr>
                  <td className="day">18</td>
                  <td className="day highlight-purple">19</td>
                  <td className="day highlight-purple">20</td>
                  <td className="day">21</td>
                  <td className="day">22</td>
                  <td className="day">23</td>
                  <td className="day">24</td>
                </tr>
              </tbody>
            </table>

            <button className="calendar-add-button">+</button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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

export default HomePage;
