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

## Protótipos

As interfaces HTML utilizadas como referência estão disponíveis em:

/prototypes

## Estrutura

```
apps/web          Next.js
apps/api          NestJS
apps/mobile       Expo (FASE 10 — não iniciar)
packages/shared   tipos e Zod (@studioemar/shared)
infrastructure    Docker (FASE 8)
docs
prototypes
```

`apps/web` sobe um sandbox temporário dos primitives.
`apps/api` responde GET /health. Sem módulos de negócio.
`@studioemar/shared` é esqueleto (contratos na FASE 1b).
Paleta oficial em DESIGN_SYSTEM.md continua pendente.

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

A aplicação será preparada para execução utilizando Docker e Docker
Compose.

O ambiente de produção utiliza Caddy como reverse proxy.