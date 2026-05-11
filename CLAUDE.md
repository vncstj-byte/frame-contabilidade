@AGENTS.md

# Frame Finance — Sistema Financeiro da Frame Contabilidade

## Sobre o projeto
Sistema web para gestão financeira do escritório de contabilidade Frame. Possui área admin (gestores) e área do cliente com acesso restrito.

## Stack
- **Next.js 16** + **React 19** + **TypeScript**
- **Supabase** (auth + PostgreSQL + RLS)
- **Tailwind CSS 4** + **shadcn/ui** (componentes em `src/components/ui/`)
- **Recharts** para gráficos
- **Deploy**: Vercel (https://frame-finance.vercel.app)

## Estrutura de pastas
```
src/
├── app/
│   ├── (auth)/          # Login, Registro, Callback do Supabase
│   ├── (dashboard)/
│   │   ├── admin/       # Painel, Dashboard, Clientes, Lançamentos, DRE
│   │   └── client/      # Área do cliente
│   └── page.tsx         # Landing/redirect
├── components/
│   ├── dashboard/       # Componentes do dashboard (nav, etc)
│   └── ui/              # shadcn/ui components
├── hooks/
├── lib/
│   ├── supabase/        # client.ts (browser) e server.ts (SSR)
│   ├── constants.ts     # Meses PT-BR, formatação BRL, categorias, gabarito DRE
│   └── dreCalculator.ts # Cálculos do DRE (receita bruta, EBITDA, margens)
└── types/
    └── database.ts      # Tipos do Supabase
```

## Banco de dados (Supabase)
Schema em `supabase-schema.sql`. 4 tabelas:
- **profiles** — usuários (roles: admin, gestor, cliente)
- **clients** — empresas clientes (CNPJ, contrato, etc)
- **financial_entries** — lançamentos (Receita/Despesa) com category_group: Honorários, Impostos, Time, Infraestrutura, Comercial
- **dashboard_updates** — controle de atualizações

RLS ativo: admins/gestores veem tudo, clientes só seus próprios dados.

## DRE (Demonstração do Resultado)
Gabarito de percentuais ideais sobre receita bruta:
- Impostos: 10% | Time: 35% | Estrutura: 10% | Marketing: 20% | Margem: 25%

## Variáveis de ambiente
Criar `.env.local` com (ver `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=<url do projeto supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do supabase>
SUPABASE_SERVICE_ROLE_KEY=<service role key - NUNCA expor no client>
RESEND_API_KEY=<api key do Resend - envio de emails>
```

## Deploy
Deploy via CLI: `vercel --prod` (não tem auto-deploy do GitHub).
Env vars também configuradas na Vercel (Settings > Environment Variables).
Documentação completa de setup em `SETUP.md`.

## Convenções
- Idioma da interface: Português (BR)
- Moeda: BRL (formatação pt-BR)
- Meses de referência no formato: "YYYY-MM"
- Períodos suportam: mês, trimestre (Q1-Q4), semestre (S1-S2), ano

## Dono do projeto
Vinicius Nunes — mentor de advogados, dono da Cúpula e da Frame Contabilidade.
GitHub: vncstj-byte
