import { useNavigate } from "react-router-dom";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "18px", boxShadow: "var(--shadow-md)" }}>
        <button 
          onClick={() => navigate("/")}
          style={{ marginBottom: "20px", padding: "8px 16px", border: "1px solid var(--border)", background: "white", borderRadius: "8px", cursor: "pointer" }}
        >
          ← Voltar
        </button>

        <h1 style={{ fontSize: "32px", marginBottom: "16px", color: "var(--brand)" }}>Termos de Serviço</h1>
        <p style={{ color: "var(--muted)", marginBottom: "32px" }}>Última atualização: Janeiro de 2026</p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>1. Aceitação dos Termos</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Ao aceder e usar o Memora, você concorda com estes Termos de Serviço. Se não concordar com qualquer parte destes termos, 
            não deve utilizar o serviço.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>2. Descrição do Serviço</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            O Memora é uma plataforma de gestão de eventos que permite aos utilizadores criar, organizar e partilhar eventos, 
            enviar convites, gerir participantes e partilhar fotografias relacionadas aos eventos.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>3. Conta de Utilizador</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)", marginBottom: "8px" }}>
            Para usar o Memora, você deve:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px" }}>
            <li>Criar uma conta usando autenticação Google</li>
            <li>Fornecer informações precisas e atualizadas</li>
            <li>Manter a segurança das suas credenciais de acesso</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>4. Uso Aceitável</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)", marginBottom: "8px" }}>
            Você concorda em NÃO:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px" }}>
            <li>Usar o serviço para fins ilegais ou não autorizados</li>
            <li>Publicar conteúdo ofensivo, difamatório ou que viole direitos de terceiros</li>
            <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
            <li>Interferir com o funcionamento adequado do serviço</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>5. Conteúdo do Utilizador</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Você mantém todos os direitos sobre o conteúdo que publica no Memora (eventos, fotografias, etc.). 
            No entanto, você concede ao Memora uma licença não exclusiva para armazenar e exibir esse conteúdo 
            conforme necessário para fornecer o serviço.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>6. Privacidade</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            O uso dos seus dados pessoais é regido pela nossa Política de Privacidade, que faz parte integrante destes Termos.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>7. Limitação de Responsabilidade</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            O Memora é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. 
            Não nos responsabilizamos por quaisquer danos diretos, indiretos ou consequenciais resultantes do uso do serviço.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>8. Modificações</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos os utilizadores sobre 
            alterações significativas através de email ou aviso no serviço.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>9. Contacto</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Para questões sobre estes Termos, contacte-nos através de: suporte@memora.pt
          </p>
        </section>
      </div>
    </div>
  );
}
