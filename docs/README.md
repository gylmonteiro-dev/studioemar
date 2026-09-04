# Studio EMAR

Sistema de gerenciamento e agendamento do Studio EMAR.

## Status

Em desenvolvimento.

Monorepo com pnpm workspaces (ADR-006).

## Documentação

Consulte:

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
apps/web          Next.js
apps/api          NestJS
apps/mobile       Expo (FASE 10 — não iniciar)
packages/shared   tipos e Zod (@studioemar/shared)
infrastructure    Docker (dev e produção)
docs
prototypes
```

`apps/web` é o frontend do aluno (FASE 2) contra mocks.
`apps/api` responde GET /health. Sem módulos de negócio.
`@studioemar/shared` contém tipos, Zod e mocks.
Contrato HTTP estático: docs/openapi.yaml.
Paleta oficial em DESIGN_SYSTEM.md (ADR-011).

Demo (sessão mock):

- João: `joao@studioemar.local` (qualquer senha)
- Ana (primeiro acesso): `ana@studioemar.local`

## Como executar

Na raiz do repositório:

```
corepack enable
pnpm install
pnpm dev:web
pnpm dev:api
```

Web: http://localhost:3000
API: http://localhost:3001/health

Requer Node.js >= 20 e pnpm >= 9.

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

Detalhes em infrastructure/README.md.
