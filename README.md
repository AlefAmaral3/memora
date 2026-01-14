# 📅 Memora - Plataforma de Gestão de Eventos

**Memora** é uma aplicação web moderna para gestão de eventos, desenvolvida com React e Firebase.

## ✨ Funcionalidades

### 📝 Gestão de Eventos
- ✅ Criar, editar e eliminar eventos
- ✅ Campos: título, data, hora, local, descrição, categoria
- ✅ Visibilidade pública/privada
- ✅ Upload de fotografias por evento
- ✅ Sistema de participantes e convites

### 📆 Calendário
- ✅ Vista mensal com eventos
- ✅ Vista semanal
- ✅ Vista diária
- ✅ Navegação intuitiva entre períodos

### 🔍 Pesquisa e Filtros
- ✅ Pesquisa por título, local e categoria
- ✅ Paginação (10 eventos por página)
- ✅ Autocomplete de localização

### 🔔 Notificações
- ✅ Lembretes configuráveis (10 min, 1h, 1 dia antes)
- ✅ Notificações por email (SendGrid)
- ✅ Notificações push (FCM)
- ✅ Envio automático via Cloud Functions

### 🔐 Segurança
- ✅ Autenticação Google (Firebase Auth)
- ✅ Regras de segurança Firestore
- ✅ Regras de segurança Storage
- ✅ Controlo de permissões por proprietário

## 🚀 Tecnologias

- **Frontend**: React 18, React Router
- **Backend**: Firebase (Firestore, Storage, Cloud Functions)
- **Autenticação**: Firebase Authentication (Google)
- **Email**: SendGrid
- **Notificações**: Firebase Cloud Messaging (FCM)
- **Hosting**: Firebase Hosting

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/memora.git
cd memora

# Instale as dependências
npm install

# Instale dependências das Cloud Functions
cd functions
npm install
cd ..

# Configure o Firebase
# Crie um projeto no Firebase Console
# Copie as credenciais para src/firebase/firebaseConfig.js

# Inicie a aplicação em desenvolvimento
npm start
```

## 🔧 Configuração

### 1. Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Google)
3. Ative Firestore Database
4. Ative Storage
5. Copie as credenciais para `src/firebase/firebaseConfig.js`

### 2. SendGrid

```powershell
firebase functions:secrets:set SENDGRID_API_KEY
```

### 3. FCM (Push Notifications)

1. Obtenha a VAPID key no Firebase Console
2. Cole em `src/services/saveFcmToken.js`

## 📤 Deploy

Veja instruções detalhadas em [DEPLOY.md](DEPLOY.md)

```powershell
# Deploy completo
firebase deploy

# Ou por partes
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
npm run build && firebase deploy --only hosting
```

## 📁 Estrutura do Projeto

```
memora/
├── public/               # Ficheiros públicos
├── src/
│   ├── components/       # Componentes React
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Lógica de negócio
│   ├── firebase/        # Configuração Firebase
│   └── styles/          # Estilos CSS
├── functions/           # Cloud Functions
├── firestore.rules      # Regras de segurança Firestore
├── storage.rules        # Regras de segurança Storage
└── firebase.json        # Configuração Firebase
```

## 🎯 Scripts Disponíveis

```bash
npm start          # Modo desenvolvimento (http://localhost:3000)
npm run build      # Build para produção
npm test           # Executar testes
firebase deploy    # Deploy para Firebase
```

## 📸 Screenshots

(Adicione screenshots da aplicação aqui)

## 🤝 Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit as alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

Desenvolvido para o projeto Memora - Gestão de Eventos

## 📞 Suporte

Para questões e suporte, abra uma [issue](https://github.com/SEU-USUARIO/memora/issues)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
