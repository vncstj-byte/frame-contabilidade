# Frame Contabilidade — Guia de Setup e Handoff

## O que e este sistema

Plataforma web de gestao financeira para o escritorio Frame Contabilidade.
Tem duas areas: admin (gestores do escritorio) e cliente (advogados atendidos).

**URL em producao:** https://framecontabilidade.com

---

## Onde esta tudo

| O que | Onde | Credenciais |
|-------|------|-------------|
| Codigo fonte | https://github.com/vncstj-byte/frame-contabilidade | GitHub do Vinicius |
| Deploy / Hosting | Vercel (projeto frame-finance) | Conta Vercel do Vinicius |
| Banco de dados | Supabase (projeto frame-contabilidade, regiao sa-east-1) | Conta Supabase do Vinicius |
| Emails transacionais | Resend (dominio framecontabilidade.com) | Conta Resend do Vinicius |
| DNS do dominio | IONOS (framecontabilidade.com) | Conta IONOS do Vinicius |

---

## Stack tecnica

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Banco:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Estilizacao:** Tailwind CSS 4
- **Email:** Resend
- **Deploy:** Vercel (CLI, nao tem auto-deploy do GitHub)
- **Graficos:** Recharts

---

## Como subir o projeto do zero (novo computador)

### 1. Clonar o repositorio

```bash
git clone https://github.com/vncstj-byte/frame-contabilidade.git
cd frame-contabilidade
npm install
```

### 2. Configurar variaveis de ambiente

Copiar `.env.example` para `.env.local` e preencher:

```bash
cp .env.example .env.local
```

Onde encontrar cada chave:
- **NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase > Settings > API
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase > Settings > API > service_role (NUNCA expor no client)
- **RESEND_API_KEY**: Resend > API Keys

### 3. Rodar local

```bash
npm run dev
```

Acessa em http://localhost:3000

### 4. Deploy para producao

O deploy e **automatico**: cada push na branch `main` do GitHub dispara um build na Vercel.

Para deploy manual (se necessario):
```bash
vercel --prod
```

---

## Variaveis de ambiente na Vercel

Todas as env vars precisam estar configuradas na Vercel tambem:
- Vercel > Settings > Environment Variables
- Adicionar as mesmas 4 variaveis do `.env.example`

---

## Estrutura do banco de dados (Supabase)

### Tabelas principais

| Tabela | Funcao |
|--------|--------|
| `profiles` | Usuarios (admin, gestor, cliente). Ligada ao auth.users |
| `clients` | Empresas clientes (CNPJ, endereco, contrato, etc.) |
| `financial_entries` | Lancamentos financeiros (receitas e despesas) |
| `password_reset_tokens` | Tokens para recuperacao de senha |
| `audit_logs` | Log de acoes dos usuarios |
| `dashboard_updates` | Controle de atualizacoes do dashboard |

### Seguranca (RLS)

Row Level Security esta ATIVA em todas as tabelas:
- Admins/Gestores: veem e editam tudo
- Clientes: veem apenas seus proprios dados
- Politicas definidas via SQL no Supabase

### Storage

- Bucket `contracts` (privado): armazena contratos em PDF/Word dos clientes
- Acesso via signed URL com expiracao de 60 segundos

---

## Fluxo de usuarios

### Cadastro de admin/gestor
1. Admin vai em Painel Admin > Gestao de Usuarios > aba Administrativos
2. Digita email e seleciona role (Admin ou Gestor)
3. Sistema cria o usuario e envia email com senha temporaria
4. Pessoa acessa, faz login, completa onboarding (nome + CPF)

### Cadastro de cliente
1. Admin vai em Gestao de Clientes > Cadastrar Cliente
2. Preenche dados da empresa + email do cliente
3. Sistema cria o usuario (role cliente), envia email de convite
4. Cliente acessa, faz login, completa onboarding
5. Cliente ve: Dashboard, DRE, e botao Contrato

### Recuperacao de senha
1. Usuario clica "Esqueci minha senha" na tela de login
2. Recebe email com link (expira em 1 hora)
3. Clica no link, define nova senha

---

## APIs do sistema

| Rota | Metodo | Funcao | Quem acessa |
|------|--------|--------|-------------|
| `/api/profile` | GET/PUT | Perfil do usuario logado | Qualquer autenticado |
| `/api/profiles` | GET/PUT/DELETE | Gerenciar todos os perfis | Admin/Gestor |
| `/api/clients` | GET/POST/PUT/DELETE | Gerenciar clientes | Admin/Gestor |
| `/api/financial-entries` | GET/POST/PUT/DELETE | Lancamentos financeiros | Admin/Gestor (cliente: so GET) |
| `/api/invite` | POST | Convidar novo usuario | Admin/Gestor |
| `/api/contract` | GET | Signed URL do contrato | Cliente |
| `/api/auth/login` | POST | Login | Publico |
| `/api/auth/logout` | GET | Logout | Qualquer autenticado |
| `/api/auth/forgot-password` | POST | Solicitar reset de senha | Publico |
| `/api/auth/reset-password` | POST | Redefinir senha com token | Publico |

---

## Servicos externos — o que renovar

| Servico | Tipo de custo | O que acontece se parar |
|---------|--------------|------------------------|
| **Vercel** | Plano gratuito (com limites) | Site sai do ar |
| **Supabase** | Plano gratuito (com limites) | Banco e auth param |
| **Resend** | Plano gratuito (100 emails/dia) | Emails de convite e reset param |
| **IONOS** | Dominio pago (anual) | framecontabilidade.com para de funcionar |

---

## Contatos

- **Dono do projeto:** Vinicius Nunes (vncs.tj@gmail.com)
- **GitHub:** vncstj-byte
- **Empresa:** Frame Contabilidade — Contabilidade para Advogados
