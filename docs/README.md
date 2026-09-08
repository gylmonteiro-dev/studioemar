# Studio EMAR

Sistema de gerenciamento e agendamento do Studio EMAR.

## Status

Fases 0 a 9 concluídas. Homologação no ar. Estado operacional,
credenciais de demo, restrições de deploy e pendências estão em
docs/HANDOFF.md.

Monorepo com pnpm workspaces (ADR-006).

## Documentação

Consulte:

- docs/HANDOFF.md
- docs/PROJECT_CONTEXT.md
- docs/BUSINESS_RULES.md
- docs/ARCHITECTURE.md
- docs/DESIGN_SYSTEM.md
- docs/ROADMAP.md
- docs/DECISIONS.md
- docs/openapi.yaml

## Protótipos

As interfaces HTML utilizadas como referência estão disponíveis em:

/prototypes

## Estrutura

```
apps/web          Next.js (aluno e treinador contra a API)
apps/api          NestJS + Prisma
apps/mobile       Expo (FASE 10 — não iniciar)
packages/shared   tipos e Zod (@studioemar/shared)
infrastructure    Docker (dev e produção)
docs
prototypes
```

Web e API reais: auth JWT, alunos, operadores, horários, reservas,
créditos, dashboard, tipos de aula e planos. Contrato HTTP em
docs/openapi.yaml. Paleta oficial em DESIGN_SYSTEM.md (ADR-011).

GET /health devolve `{ status, now }`. As agendas usam esse
relógio para abrir a semana corrente.

## Como executar

Na raiz do repositório:

```
corepack enable
pnpm install
pnpm db:up
pnpm prisma:deploy
CLOCK_NOW=2026-09-03T15:00:00.000Z pnpm dev:api
pnpm dev:web
```

Não executar o seed se o banco local já tiver o estado de demo
limpo descrito no HANDOFF.

Web: http://localhost:3000
API: http://localhost:3001/health
Swagger: http://localhost:3001/docs

Requer Node.js >= 20 e pnpm >= 9.

Contas de demo e senha `studioemar`: docs/HANDOFF.md.

## Infraestrutura

/infrastructure

Desenvolvimento (só o banco):

```
pnpm db:up
pnpm prisma:deploy
pnpm prisma:seed
```

Produção (postgres + api + web em containers):

```
cp infrastructure/.env.example infrastructure/.env
pnpm prod:build
pnpm prod:up
```

Backup: `pnpm prod:backup`.

Web e API só escutam em 127.0.0.1; o Postgres fica na rede interna.
Na VPS, o Caddy já existente faz o proxy (FASE 9).

Não alterar a VPS nem o Caddy sem autorização. Checklist de
publicação em docs/HANDOFF.md.

Detalhes em infrastructure/README.md.
