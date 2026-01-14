import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
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

        <h1 style={{ fontSize: "32px", marginBottom: "16px", color: "var(--brand)" }}>Política de Privacidade</h1>
        <p style={{ color: "var(--muted)", marginBottom: "32px" }}>Última atualização: Janeiro de 2026</p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>1. Introdução</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            A Memora respeita a sua privacidade e está comprometida em proteger os seus dados pessoais. 
            Esta Política de Privacidade explica como recolhemos, usamos e protegemos as suas informações 
            quando utiliza o nosso serviço.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>2. Informações que Recolhemos</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)", marginBottom: "8px" }}>
            Recolhemos as seguintes informações:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px" }}>
            <li><strong>Informações de Conta:</strong> Nome, email e foto de perfil (via autenticação Google)</li>
            <li><strong>Dados de Eventos:</strong> Títulos, datas, localizações, descrições e categorias dos eventos que você cria</li>
            <li><strong>Fotografias:</strong> Imagens que você carrega para os eventos</li>
            <li><strong>Dados de Utilização:</strong> Informações sobre como você usa o serviço</li>
            <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de browser e sistema operativo</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>3. Como Usamos as Suas Informações</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)", marginBottom: "8px" }}>
            Utilizamos os seus dados para:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px" }}>
            <li>Fornecer e manter o serviço Memora</li>
            <li>Processar e gerir os seus eventos e convites</li>
            <li>Enviar notificações sobre eventos e lembretes</li>
            <li>Melhorar a experiência do utilizador</li>
            <li>Garantir a segurança e prevenir fraudes</li>
            <li>Comunicar com você sobre atualizações do serviço</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>4. Partilha de Informações</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            NÃO vendemos os seus dados pessoais. Partilhamos informações apenas quando:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px", marginTop: "8px" }}>
            <li>Você nos autoriza (ex: convidar participantes para eventos)</li>
            <li>É necessário para fornecedores de serviços terceiros (ex: Firebase, Google Maps)</li>
            <li>Exigido por lei ou para proteger direitos legais</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>5. Armazenamento e Segurança</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Os seus dados são armazenados de forma segura no Firebase (Google Cloud). Implementamos medidas de segurança 
            técnicas e organizacionais para proteger as suas informações contra acesso não autorizado, alteração, 
            divulgação ou destruição.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>6. Os Seus Direitos (RGPD)</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)", marginBottom: "8px" }}>
            Você tem direito a:
          </p>
          <ul style={{ lineHeight: "1.8", color: "var(--text)", paddingLeft: "20px" }}>
            <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
            <li><strong>Retificação:</strong> Corrigir informações incorretas</li>
            <li><strong>Eliminação:</strong> Solicitar a eliminação dos seus dados</li>
            <li><strong>Portabilidade:</strong> Receber os seus dados em formato estruturado</li>
            <li><strong>Oposição:</strong> Opor-se ao processamento dos seus dados</li>
            <li><strong>Retirada de consentimento:</strong> A qualquer momento</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>7. Cookies e Tecnologias Similares</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Utilizamos cookies e tecnologias similares para autenticação, preferências do utilizador e análise de uso. 
            Você pode controlar cookies através das configurações do seu browser.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>8. Retenção de Dados</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Mantemos os seus dados apenas pelo tempo necessário para fornecer o serviço ou conforme exigido por lei. 
            Você pode solicitar a eliminação da sua conta e dados a qualquer momento.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>9. Menores de Idade</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            O serviço não se destina a menores de 16 anos. Não recolhemos intencionalmente dados de menores.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>10. Contacto</h2>
          <p style={{ lineHeight: "1.6", color: "var(--text)" }}>
            Para questões sobre privacidade ou exercer os seus direitos, contacte:<br/>
            Email: privacidade@memora.pt<br/>
            Responsável pela Proteção de Dados: DPO Memora
          </p>
        </section>
      </div>
    </div>
  );
}
