# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2, 3, 4, 5, 6 e 7 concluídas e mergeadas em main
(`f353cc1`).

Frontend aluno e treinador em apps/web contra a API Nest.
JWT no sessionStorage (ADR-015). GET /dashboard no Nest.

Não trabalhar na main. Próxima fatia (FASE 8) em branch
nova a partir de main.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009). Prisma em apps/api;
passwordHash só no banco (ADR-013). JWT no JSON (ADR-014).
Sessão web: ADR-015.

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
- Testes: `pnpm test` (shared + API + web unitário)
- E2E: `pnpm test:e2e` (Playwright, Chromium, API mockada)

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

## Testes (FASE 7)

```
pnpm test
pnpm test:e2e
```

Na primeira vez do e2e: `pnpm --filter web exec playwright install chromium`.

O e2e sobe o Next na :3100 com
`NEXT_PUBLIC_CLOCK_NOW=2026-09-03T15:00:00.000Z` e intercepta
a API em :3001. Não precisa de Postgres nem da Nest.

Cobertura:

- Cancelamento RN-012 / RN-017 (aluno e professor)
- Créditos RN-007 a RN-010, RN-013, RN-018 a RN-020
- Capacidade RN-008
- Conflitos (e-mail, horário recorrente, já inscrito)
- Permissões (RolesGuard, JWT, rotas aluno/treinador)
- Responsividade 390 / 768 / 1024 / 1440
- Fluxos: login, cancelar, dashboard, horários sem nomes
- Contrato Zod × docs/openapi.yaml

## Próxima atividade

FASE 8 — infraestrutura: Dockerfile Web/API, Compose de
produção, volumes, health checks, variáveis, backup.

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

- Sem mailer de recuperação.
- FASE 8 (infra de produção) não iniciada.
