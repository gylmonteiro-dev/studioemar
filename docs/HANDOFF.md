# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2, 3, 4 e 5 (fatia autorizada) concluídas.

Frontend aluno e treinador em apps/web contra mocks.
Backend Nest em apps/api com JWT real. Sem FASE 6.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009). Prisma em apps/api;
passwordHash só no banco (ADR-013). JWT no JSON (ADR-014).

Não trabalhar na main. Próxima fatia (FASE 6) em branch
nova a partir de main, depois do merge desta.

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

Seed: João e Carlos com senha `studioemar`;
Ana em primeiro acesso (`passwordHash` null);
créditos nas 3 origens; fechamento sem crédito;
waitlist FIFO no slot lotado.

Prisma Studio: `pnpm prisma:studio`

## Demo API

```
pnpm dev:api
```

Relógio opcional para RN-012: `CLOCK_NOW=2026-09-03T15:00:00.000Z`

- João: joao@studioemar.local / studioemar
- Ana (1º acesso): ana@studioemar.local
- Carlos: carlos@studioemar.local / studioemar
- Cancelar `booking-hoje-sem-credito` com CLOCK_NOW = sem crédito
- Cancelar `booking-seg-com-credito` = com crédito

## Demo web (ainda mocks)

- João: joao@studioemar.local — qualquer senha
- Ana (primeiro acesso): ana@studioemar.local
- Carlos (treinador): carlos@studioemar.local — qualquer senha
- MOCK_NOW = 2026-09-03T15:00:00.000Z

## Próxima atividade

FASE 6 — ligar o frontend à API.
Não antecipar.

## Não fazer ainda

- ligar o frontend à API (FASE 6);
- dashboard Nest;
- join na lista de espera;
- e-mail de recuperação;
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno.

## Pendências

- Integração web ↔ API (FASE 6).
