# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2, 3, 4 e 5 concluídas e mergeadas em main.

Frontend aluno e treinador em apps/web contra mocks.
Backend Nest em apps/api com JWT real. Ligar web à API
é FASE 6.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009). Prisma em apps/api;
passwordHash só no banco (ADR-013). JWT no JSON (ADR-014).

FASE 5 entrou em main neste merge (1a57c26).
Não trabalhar na main. Próxima fatia (FASE 6) em branch
nova a partir de main.

## Já disponível

- Telas aluno e treinador contra mocks
- Contrato Zod + OpenAPI da fatia FASE 5
- ER em docs/DOMAIN.md (9 tabelas)
- Prisma schema, migrations e seed
- Compose só do banco: infrastructure/docker-compose.dev.yml
- Nest: auth, students, schedules, bookings, credits
- Swagger da fatia: http://localhost:3001/docs
- GET /health intacto

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

## Demo API (FASE 5)

```
CLOCK_NOW=2026-09-03T15:00:00.000Z pnpm dev:api
```

- João: joao@studioemar.local / studioemar
- Ana (1º acesso): ana@studioemar.local
- Carlos: carlos@studioemar.local / studioemar
- Cancelar `booking-hoje-sem-credito` = sem crédito
- Cancelar `booking-seg-com-credito` = com crédito
- Swagger: http://localhost:3001/docs

Se a :3001 estiver com processo antigo, reiniciar.

## Demo web (ainda mocks)

```
pnpm dev:web
```

http://localhost:3000

- João: joao@studioemar.local — qualquer senha
- Ana (primeiro acesso): ana@studioemar.local
- Carlos (treinador): carlos@studioemar.local — qualquer senha
- MOCK_NOW = 2026-09-03T15:00:00.000Z

## Próxima atividade

FASE 6 — ligar o frontend à API.
Começar por autenticação, agenda, cancelamentos,
créditos e reposição.

Dashboard Nest não existe (ficou fora da FASE 5).
Não assumir endpoint de ocupação. Apresentar o
conflito se a fatia incluir dashboard.

Quando autorizar, planeje primeiro. Não avance sozinho.

## Não fazer ainda

- dashboard Nest (não implementado);
- join na lista de espera;
- e-mail de recuperação (token existe; sem mailer);
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno.

## Pendências

- Integração web ↔ API (FASE 6).
- Sessão web ainda é `userId` no sessionStorage.
  A API devolve access + refresh (ADR-014).
