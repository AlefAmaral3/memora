# 🔒 Segurança - Memora

## Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para proteger informações sensíveis como chaves de API.

### ⚠️ IMPORTANTE

**NUNCA faça commit de arquivos contendo:**
- Chaves de API
- Tokens de autenticação
- Senhas
- Credenciais do Firebase
- Chaves VAPID
- Outros dados sensíveis

### 📝 Arquivo .env

O arquivo `.env` contém as credenciais reais e **NÃO deve ser commitado** ao Git.

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais:
   ```env
   REACT_APP_FIREBASE_API_KEY=sua_chave_aqui
   REACT_APP_FIREBASE_AUTH_DOMAIN=seu_dominio_aqui
   REACT_APP_FIREBASE_PROJECT_ID=seu_projeto_aqui
   REACT_APP_FIREBASE_STORAGE_BUCKET=seu_bucket_aqui
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
   REACT_APP_FIREBASE_APP_ID=seu_app_id_aqui
   REACT_APP_FIREBASE_VAPID_KEY=sua_vapid_key_aqui
   ```

### 🔐 Obtendo as Credenciais

#### Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Project Settings** (ícone de engrenagem) > **General**
4. Em "Your apps", selecione a app web
5. Copie as credenciais de `firebaseConfig`

#### VAPID Key (Push Notifications)
1. No Firebase Console, vá em **Project Settings** > **Cloud Messaging**
2. Em "Web Push certificates", copie o "Key pair"
3. Cole no campo `REACT_APP_FIREBASE_VAPID_KEY`

#### SendGrid (Cloud Functions)
1. Crie uma conta no [SendGrid](https://sendgrid.com/)
2. Gere uma API Key
3. Configure como secret nas Cloud Functions:
   ```bash
   firebase functions:secrets:set SENDGRID_API_KEY
   ```

### 🛡️ Arquivos Protegidos pelo .gitignore

Os seguintes arquivos/pastas estão configurados para **NÃO** serem commitados:

- `.env` - Variáveis de ambiente com credenciais reais
- `.env.local`
- `.env.*.local`
- `*.local`
- `.runtimeconfig.json` - Configurações do Firebase Functions
- `node_modules/`
- `build/`
- `.firebase/`

### ✅ Boas Práticas

1. **Nunca** hardcode chaves de API no código
2. **Sempre** use variáveis de ambiente via `process.env.NOME_DA_VARIAVEL`
3. **Mantenha** o arquivo `.env.example` atualizado (sem valores reais)
4. **Revogue** imediatamente qualquer chave que seja acidentalmente exposta
5. **Use** diferentes credenciais para desenvolvimento, teste e produção

### 🚨 Em Caso de Exposição Acidental

Se você acidentalmente commitou informações sensíveis:

1. **Revogue imediatamente** as credenciais expostas
2. **Gere novas** credenciais
3. **Remova** do histórico do Git usando `git filter-branch` ou `BFG Repo-Cleaner`
4. **Force push** para o repositório remoto (se já foi enviado)

### 📞 Reportar Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** abra uma issue pública. 
Entre em contato diretamente com os mantenedores do projeto.

---

**Lembre-se:** A segurança é responsabilidade de todos! 🔐
