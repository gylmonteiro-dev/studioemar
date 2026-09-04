# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2, 3 e 4 concluídas.

Frontend aluno e treinador em apps/web contra mocks.
Prisma + PostgreSQL em apps/api. Sem Nest de negócio.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009). Prisma em apps/api;
passwordHash só no banco (ADR-013).

FASE 4 entra em main neste merge. Não trabalhar na main.
Próxima fatia (FASE 5) em branch nova a partir de main.

## Já disponível

- Telas aluno e treinador contra mocks
- Contrato Zod + OpenAPI estático
- ER em docs/DOMAIN.md (9 tabelas)
- Prisma schema, migration inicial e seed do catálogo mock
- Compose só do banco: infrastructure/docker-compose.dev.yml
- PrismaModule / PrismaService (infra). GET /health intacto

## Banco local

```
pnpm db:up
pnpm prisma:deploy
pnpm prisma:seed
```

DATABASE_URL (apps/api/.env.example):

postgresql://studioemar:studioemar@localhost:5434/studioemar

A porta 5434 evita conflito com Postgres já instalado
na máquina. Quem tiver Postgres livre em outra porta
pode só ajustar o DATABASE_URL.

Seed: João, Ana, Carlos; créditos nas 3 origens;
fechamento sem crédito; waitlist FIFO no slot lotado.
passwordHash permanece null (FASE 5).

Prisma Studio: `pnpm prisma:studio`

## Demo web (ainda mocks)

- João: joao@studioemar.local — qualquer senha
- Ana (primeiro acesso): ana@studioemar.local
- Carlos (treinador): carlos@studioemar.local — qualquer senha
- MOCK_NOW = 2026-09-03T15:00:00.000Z

## Próxima atividade

FASE 5 — backend Nest sob demanda.
Começar por auth, students, schedules, bookings e credits.
JWT real. Não criar todos os módulos de uma vez.

## Não fazer ainda

- implementar os paths do OpenAPI no Nest (FASE 5);
- ligar o frontend à API (FASE 6);
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno;
- join na lista de espera.

## Pendências

- JWT real (FASE 5).
