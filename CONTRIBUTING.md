# 🤝 Guia de Contribuição - Memora

Obrigado por considerar contribuir para o Memora! Este documento fornece diretrizes para contribuir com o projeto.

## 🚀 Como Começar

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone o seu fork
git clone https://github.com/SEU-USUARIO/memora.git
cd memora
```

### 2. Configure o Ambiente

```bash
# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais (veja SECURITY.md)

# Instale dependências das Cloud Functions
cd functions
npm install
cd ..
```

### 3. Execute o Projeto

```bash
npm start
```

## 📝 Processo de Contribuição

### 1. Crie uma Branch

```bash
git checkout -b feature/minha-nova-funcionalidade
# ou
git checkout -b fix/correcao-de-bug
```

### 2. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga as convenções de código do projeto
- Adicione comentários quando necessário
- Teste suas alterações localmente

### 3. Commit

Use mensagens de commit claras e descritivas:

```bash
git add .
git commit -m "Add: nova funcionalidade X"
# ou
git commit -m "Fix: correção do bug Y"
# ou
git commit -m "Update: melhoria na funcionalidade Z"
```

**Tipos de commit:**
- `Add:` - Nova funcionalidade
- `Fix:` - Correção de bug
- `Update:` - Atualização de funcionalidade existente
- `Refactor:` - Refatoração de código
- `Docs:` - Atualização de documentação
- `Style:` - Formatação, ponto e vírgula, etc
- `Test:` - Adição ou correção de testes

### 4. Push e Pull Request

```bash
git push origin feature/minha-nova-funcionalidade
```

Depois, abra um Pull Request no GitHub:
1. Vá para o repositório original
2. Clique em "Pull Requests" > "New Pull Request"
3. Selecione sua branch
4. Descreva suas alterações detalhadamente
5. Aguarde a revisão

## ✅ Checklist de Pull Request

Antes de enviar seu PR, certifique-se de que:

- [ ] O código está funcionando corretamente
- [ ] Não há erros no console
- [ ] O código segue as convenções do projeto
- [ ] A documentação foi atualizada (se necessário)
- [ ] Não há credenciais ou informações sensíveis no código
- [ ] O `.gitignore` está sendo respeitado
- [ ] As mensagens de commit são claras

## 🐛 Reportar Bugs

Para reportar bugs, abra uma [issue](https://github.com/AlefAmaral3/memora/issues) com:

1. **Título claro e descritivo**
2. **Passos para reproduzir** o problema
3. **Comportamento esperado** vs **comportamento atual**
4. **Screenshots** (se aplicável)
5. **Ambiente:**
   - Navegador e versão
   - Sistema operacional
   - Versão do Node.js

## 💡 Sugerir Funcionalidades

Para sugerir novas funcionalidades, abra uma [issue](https://github.com/AlefAmaral3/memora/issues) com:

1. **Título claro e descritivo**
2. **Descrição detalhada** da funcionalidade
3. **Motivação:** Por que esta funcionalidade é útil?
4. **Exemplos de uso** (se aplicável)
5. **Mockups ou wireframes** (opcional, mas ajuda!)

## 🔒 Segurança

**NUNCA** inclua informações sensíveis em commits ou pull requests:

- ❌ Chaves de API
- ❌ Tokens de autenticação
- ❌ Senhas
- ❌ Credenciais do Firebase

Consulte [SECURITY.md](SECURITY.md) para mais detalhes.

## 📚 Recursos Úteis

- [Documentação do React](https://react.dev/)
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Documentação do React Router](https://reactrouter.com/)
- [Guia de Git](https://git-scm.com/doc)

## 🎨 Padrões de Código

### JavaScript/React

- Use componentes funcionais com hooks
- Use `const` e `let` (não use `var`)
- Use arrow functions quando apropriado
- Nomeie componentes em PascalCase
- Nomeie variáveis e funções em camelCase
- Use JSX de forma idiomática

### CSS

- Use nomes de classes descritivos
- Prefira CSS Modules ou styled-components
- Mantenha consistência com o estilo existente

## 🙏 Código de Conduta

- Seja respeitoso com outros contribuidores
- Aceite feedback construtivo
- Foque no que é melhor para o projeto
- Seja paciente e colaborativo

## 📞 Contato

Se tiver dúvidas, abra uma [issue](https://github.com/AlefAmaral3/memora/issues) ou entre em contato com os mantenedores.

---

**Obrigado por contribuir! 🎉**
