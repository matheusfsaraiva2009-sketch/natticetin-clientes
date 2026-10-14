# Val Acessórios — Catálogo Digital

Site de catálogo digital para toucas dupla face e scrunchies de cetim, com painel administrativo exclusivo e integração com WhatsApp.

**Tecnologias:** React 18 · TypeScript · Vite · Firebase 10 · React Router 6

---

## Índice

1. [Instalação e execução local](#1-instalação-e-execução-local)
2. [Criar projeto no Firebase](#2-criar-projeto-no-firebase)
3. [Configurar o Firebase Authentication](#3-configurar-o-firebase-authentication)
4. [Criar o Firestore](#4-criar-o-firestore)
5. [Habilitar o Storage](#5-habilitar-o-storage)
6. [Publicar as regras de segurança](#6-publicar-as-regras-de-segurança)
7. [Configurar a conta da proprietária](#7-configurar-a-conta-da-proprietária)
8. [Preencher as variáveis de ambiente](#8-preencher-as-variáveis-de-ambiente)
9. [Testar o catálogo](#9-testar-o-catálogo)
10. [Configurar WhatsApp e Instagram](#10-configurar-whatsapp-e-instagram)
11. [Publicar na Vercel](#11-publicar-na-vercel)
12. [Adicionar os primeiros produtos](#12-adicionar-os-primeiros-produtos)
13. [Verificar a sincronização em tempo real](#13-verificar-a-sincronização-em-tempo-real)

---

## 1. Instalação e execução local

### Pré-requisitos

- **Node.js** v18 ou superior → [nodejs.org](https://nodejs.org)
- Uma conta no **Firebase** → [firebase.google.com](https://firebase.google.com)
- Uma conta na **Vercel** → [vercel.com](https://vercel.com) (para publicação)

### Instalar dependências

```bash
npm install
```

### Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais Firebase:

```bash
# Windows (PowerShell)
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

Abra o arquivo `.env.local` e preencha os valores reais (veja a seção 8).

### Executar localmente

```bash
npm run dev
```

O site abrirá em `http://localhost:5173`

### Compilar para produção

```bash
npm run build
```

---

## 2. Criar projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Escolha um nome (ex: `val-acessorios`)
4. Desative o Google Analytics se não quiser (opcional)
5. Aguarde a criação e clique em **"Continuar"**
6. Na tela inicial do projeto, clique no ícone **`</>`** (Web) para registrar um aplicativo web
7. Dê um apelido ao app (ex: `val-web`) e clique em **"Registrar app"**
8. Copie as credenciais exibidas — você precisará delas na etapa 8

---

## 3. Configurar o Firebase Authentication

1. No console do Firebase, vá em **Authentication** (menu lateral)
2. Clique em **"Primeiros passos"**
3. Na aba **"Sign-in method"**, clique em **"E-mail/senha"**
4. Ative a opção e salve
5. Não ative outros provedores

---

## 4. Criar o Firestore

1. No console do Firebase, vá em **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de produção"** (as regras de segurança serão publicadas na etapa 6)
4. Selecione a região mais próxima do Brasil (ex: `southamerica-east1`)
5. Aguarde a criação

### Estrutura de coleções criada automaticamente pelo site:

| Coleção | Descrição |
|---------|-----------|
| `products` | Todos os produtos (toucas e scrunchies) |
| `settings/store` | Configurações públicas da loja |
| `admins` | UIDs dos administradores autorizados |

---

## 5. Habilitar o Storage

1. No console do Firebase, vá em **Storage**
2. Clique em **"Primeiros passos"**
3. Selecione **"Iniciar no modo de produção"**
4. Escolha a mesma região do Firestore
5. Aguarde a criação

---

## 6. Publicar as regras de segurança

### Instalar o Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Selecione:
- ✅ Firestore
- ✅ Storage

Quando perguntar sobre os arquivos de regras, aponte para os arquivos do projeto:
- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`

### Publicar as regras

```bash
# Publicar regras do Firestore
firebase deploy --only firestore:rules

# Publicar regras do Storage
firebase deploy --only storage:rules

# Publicar os índices do Firestore (necessário para as queries)
firebase deploy --only firestore:indexes
```

> **Atenção:** Sem publicar as regras e os índices, o catálogo não funcionará corretamente.

---

## 7. Configurar a conta da proprietária

### Passo 1 — Criar o usuário no Firebase Authentication

1. No console do Firebase, vá em **Authentication > Usuários**
2. Clique em **"Adicionar usuário"**
3. Informe o e-mail e a senha da proprietária
4. Clique em **"Adicionar usuário"**
5. Copie o **UID** gerado (coluna "ID do usuário")

### Passo 2 — Registrar o UID como administrador no Firestore

1. Vá em **Firestore Database > Dados**
2. Clique em **"Iniciar coleção"**
3. ID da coleção: `admins`
4. ID do documento: **cole o UID copiado no passo anterior**
5. Adicione o campo:
   - Campo: `isAdmin`
   - Tipo: `boolean`
   - Valor: `true`
6. Salve

> **Por que isso é seguro?** As regras do Firestore impedem que qualquer usuário crie ou edite documentos na coleção `admins`. Apenas você (pelo console do Firebase) pode autorizar administradores.

---

## 8. Preencher as variáveis de ambiente

Abra o arquivo `.env.local` e substitua os valores de exemplo:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### Como obter essas credenciais

1. No console do Firebase, clique no ícone de engrenagem ⚙️ > **"Configurações do projeto"**
2. Role até a seção **"Seus aplicativos"**
3. Clique no app web que você registrou
4. Copie os valores de `firebaseConfig`

> **Importante:** Essas credenciais são seguras para estar no frontend. A proteção real vem das regras de segurança do Firebase. Nunca coloque chaves de serviço (Admin SDK) no frontend.

---

## 9. Testar o catálogo

Após configurar as variáveis e iniciar com `npm run dev`:

1. Acesse `http://localhost:5173/` — deve carregar o catálogo vazio
2. Acesse `http://localhost:5173/login` — deve mostrar a tela de login
3. Faça login com o e-mail e senha criados na etapa 7
4. Deve redirecionar para `http://localhost:5173/admin`
5. Acesse o painel e cadastre um produto de teste

---

## 10. Configurar WhatsApp e Instagram

1. Entre no painel administrativo (`/admin`)
2. Clique em **"Configurações"** no menu lateral
3. Preencha:
   - **Número do WhatsApp:** formato `55DDNUMERO` sem espaços ou símbolos
     - Exemplo: `5511999999999` (55 + DDD + número)
   - **Instagram (arroba):** ex: `@valacessorios`
   - **URL do Instagram:** ex: `https://instagram.com/valacessorios`
4. Clique em **"Salvar configurações"**
5. Volte ao catálogo — as alterações aparecem imediatamente

---

## 11. Publicar na Vercel

### Passo 1 — Enviar para o GitHub

```bash
git init
git add .
git commit -m "Primeiro commit — Val Acessórios"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/val-acessorios.git
git push -u origin main
```

### Passo 2 — Importar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Conecte sua conta do GitHub e selecione o repositório
4. Vercel detecta automaticamente o Vite — não mude nada em "Build Settings"
5. Clique em **"Environment Variables"** e adicione as mesmas variáveis do `.env.local`
6. Clique em **"Deploy"**

### Passo 3 — Autorizar o domínio no Firebase

1. No console do Firebase, vá em **Authentication > Settings > Authorized domains**
2. Clique em **"Adicionar domínio"**
3. Adicione o domínio da Vercel (ex: `val-acessorios.vercel.app`)
4. Salve

> **Atenção:** Sem autorizar o domínio, o login não funcionará em produção.

---

## 12. Adicionar os primeiros produtos

1. Entre no painel admin (`/admin`)
2. Clique em **"Novo produto"** no menu
3. Preencha todos os campos:
   - **Nome:** nome do modelo
   - **Categoria:** Touca Dupla Face ou Scrunchie de Cetim
   - **Cor:** cor da peça
   - **Tamanho:** Único, Padrão, etc.
   - **Preço:** valor em reais (ex: `25.00`)
   - **Estoque:** quantidade disponível
   - **Foto:** clique em "Selecionar foto" e envie a imagem
   - **Status:** Ativo
4. Clique em **"Cadastrar produto"**
5. O produto aparece no catálogo público instantaneamente

---

## 13. Verificar a sincronização em tempo real

1. Abra o catálogo público em uma aba (`/`)
2. Em outra aba, abra o painel admin (`/admin`)
3. No admin, altere o estoque ou o preço de um produto e salve
4. Observe o catálogo público atualizar automaticamente, sem recarregar a página

---

## Estrutura do projeto

```
src/
├── components/
│   ├── Cart/           # Drawer do carrinho
│   ├── Footer/         # Rodapé
│   ├── Header/         # Cabeçalho com navegação
│   ├── ProductCard/    # Card de produto
│   ├── ProductGrid/    # Grade com filtros
│   └── ProtectedRoute/ # Proteção de rotas admin
├── contexts/
│   ├── AuthContext.tsx     # Estado de autenticação
│   ├── CartContext.tsx     # Estado do carrinho
│   └── SettingsContext.tsx # Configurações da loja
├── hooks/
│   └── useProducts.ts  # Hooks para dados do Firestore
├── pages/
│   ├── Admin/          # Painel administrativo
│   ├── Home/           # Página inicial e catálogo
│   ├── Login/          # Tela de login
│   └── NotFound/       # Página 404
├── services/
│   ├── auth.ts         # Firebase Authentication
│   ├── firebase.ts     # Inicialização do Firebase
│   ├── products.ts     # CRUD de produtos + Firestore
│   ├── settings.ts     # Configurações da loja
│   └── storage.ts      # Firebase Storage (imagens)
├── styles/
│   └── globals.css     # Design system completo
├── types/
│   └── index.ts        # Tipos TypeScript
└── utils/
    └── index.ts        # Formatação e utilitários
```

---

## Fluxo do pedido pelo WhatsApp

```
Cliente navega → Adiciona ao carrinho → Revisão do pedido
→ Validação em tempo real (Firestore) → WhatsApp abre com mensagem completa
→ Cliente pressiona Enviar no WhatsApp → Proprietária confirma e combina pagamento
```

> **Importante:** O site não processa pagamentos nem confirma pedidos automaticamente.
> Toda a confirmação é feita diretamente entre cliente e proprietária pelo WhatsApp.

---

## Segurança

| Proteção | Como funciona |
|----------|---------------|
| Autenticação | Firebase Auth com e-mail e senha |
| Autorização admin | Documento `admins/{uid}` no Firestore |
| Regras Firestore | Visitantes leem apenas produtos ativos |
| Regras Storage | Upload restrito a usuários autenticados |
| Rota protegida | Frontend redireciona para `/login` |
| Validação de preços | Carrinho revalida contra Firestore antes do WhatsApp |

---

*Desenvolvido para Val Acessórios — Toucas e Scrunchies de Cetim*
