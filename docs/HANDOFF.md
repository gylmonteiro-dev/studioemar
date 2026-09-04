# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2, 3, 4, 5 e 6 concluídas e mergeadas em main
(`19fecd4`).

Frontend aluno e treinador em apps/web contra a API Nest.
JWT no sessionStorage (ADR-015). GET /dashboard no Nest.

Não trabalhar na main. Próxima fatia (FASE 7) em branch
nova a partir de main.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009). Prisma em apps/api;
passwordHash só no banco (ADR-013). JWT no JSON (ADR-014).
Sessão web: ADR-015.

FASE 6 entrou em main neste merge (19fecd4).

## Já disponível

- Telas aluno e treinador contra a API (sem `mock-api.ts`)
- Cliente `apps/web/src/lib/api-client.ts` (Bearer + refresh
  em 401)
- Contrato Zod + OpenAPI (auth, students, schedules,
  bookings, credits, dashboard)
- ER em docs/DOMAIN.md (9 tabelas)
- Prisma schema, migrations e seed
- Compose só do banco: infrastructure/docker-compose.dev.yml
- Nest: auth, students, schedules, bookings, credits,
  dashboard
- Swagger: http://localhost:3001/docs
- GET /health intacto
- Testes de domínio: `pnpm test:api`
  (`slot-occupancy`, `occupancy`)

## Banco local

```
pnpm db:up
pnpm prisma:deploy
pnpm prisma:seed
```

DATABASE_URL (apps/api/.env.example):

postgresql://studioemar:studioemar@localhost:5434/studioemar

A porta 5434 evita conflito com Postgres já instalado
na máquina.

Seed: João e Carlos com senha `studioemar`;
Ana em primeiro acesso (`passwordHash` null);
créditos nas 3 origens; fechamento sem crédito;
waitlist FIFO no slot lotado.

Prisma Studio: `pnpm prisma:studio`

## Demo (web + API)

```
CLOCK_NOW=2026-09-03T15:00:00.000Z pnpm dev:api
pnpm dev:web
```

`apps/web/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_CLOCK_NOW=2026-09-03T15:00:00.000Z
```

Alinhar `NEXT_PUBLIC_CLOCK_NOW` com `CLOCK_NOW` na demo
RN-012 (preview de crédito no cancelamento).

http://localhost:3000 — senha `studioemar` (João e Carlos).

- João: joao@studioemar.local / studioemar
- Ana (1º acesso): ana@studioemar.local
- Carlos: carlos@studioemar.local / studioemar
- Cancelar `booking-hoje-sem-credito` = sem crédito
- Cancelar `booking-seg-com-credito` = com crédito
- Swagger: http://localhost:3001/docs

Sessão: access + refresh em `sessionStorage`
(`studioemar.session`). Logout só limpa o storage local.

Se a :3000 falhar com `.next` (ENOENT), reiniciar
`pnpm dev:web`. Se a :3001 estiver com processo antigo,
reiniciar a API.

## Próxima atividade

FASE 7 — testes: regras de cancelamento, créditos,
capacidade, conflitos, permissões, responsividade,
fluxos críticos, contratos Zod/OpenAPI.

Quando autorizar, planeje primeiro. Não avance sozinho.

## Não fazer ainda

- join na lista de espera;
- e-mail de recuperação (token existe; sem mailer;
  tela de reset com token não existe);
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno.

## Pendências

- FASE 7 (testes). Hoje só há testes de domínio no Nest
  (`pnpm test:api`). Sem suíte web/e2e.
- Sem mailer de recuperação.
