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
apps/web          Next.js (FASE 1+)
apps/api          NestJS (FASE 1+)
apps/mobile       Expo (FASE 10 — não iniciar)
packages/shared   tipos e Zod (FASE 1+)
infrastructure    Docker (FASE 8)
docs
prototypes
```

Os workspaces ainda não possuem pacotes. Serão preenchidos
nas próximas tarefas da FASE 1.

## Como executar

Na raiz do repositório:

```
corepack enable
pnpm install
```

Requer Node.js >= 20 e pnpm >= 9.

## Infraestrutura

/infrastructure

A aplicação será preparada para execução utilizando Docker e Docker
Compose.

O ambiente de produção utiliza Caddy como reverse proxy.