# Handoff — Studio EMAR

## Situação atual

FASE 0 a 8 concluídas e mergeadas em main. FASE 9 concluída
em homologação na branch `fase-9-vps`.

Frontend aluno e treinador em apps/web contra a API Nest.
JWT no sessionStorage (ADR-015). GET /dashboard no Nest.
A stack está publicada na VPS e disponível por HTTPS.

Não trabalhar na main. Antes da próxima fatia, revisar e
mergear `fase-9-vps`.

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
- Stack de produção em containers (FASE 8)

## Banco local

```
pnpm db:up
pnpm prisma:deploy
pnpm prisma:seed
```

DATABASE_URL (apps/api/.env.example):

postgresql://studioemar:studioemar@localhost:5434/studioemar

A porta 5434 evita conflito com Postgres já instalado
na máquina. O container agora é `studio-postgres-dev`,
para não colidir com o `studio-postgres` de produção.

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

## Produção em containers (FASE 8)

```
cp infrastructure/.env.example infrastructure/.env
pnpm prod:build
pnpm prod:up
pnpm prod:ps
pnpm prod:logs
pnpm prod:down
```

Backup e restore:

```
pnpm prod:backup
pnpm prod:restore infrastructure/backups/<arquivo>.sql.gz
```

studio-web em 127.0.0.1:3000 e studio-api em 127.0.0.1:3001.
studio-postgres não publica porta: só a rede interna `studio`
(ADR-017). Dados no volume `studio_postgres_data`.

A API roda `prisma migrate deploy` no entrypoint; use
`RUN_MIGRATIONS=false` para janela controlada (ADR-016).
O seed local não deve ser usado em produção. Há uma rotina
compilada, destrutiva e confirmada para a homologação.

`NEXT_PUBLIC_API_URL` é build arg: trocar o domínio exige
`pnpm prod:build`, não só restart. `WEB_ORIGIN` é o CORS
da API e precisa bater com o domínio da web.

Operação detalhada em infrastructure/README.md.

## Homologação na VPS (FASE 9)

- Web: https://studioemar.com.br
- API: https://api.studioemar.com.br
- Swagger: https://api.studioemar.com.br/docs
- VPS: Ubuntu 24.04, Docker 29, Compose 2.40, 1 vCPU,
  4 GB RAM, sem swap
- Projeto: `/opt/studioemar`, branch `fase-9-vps`
- Caddy compartilhado: container `nexus_caddy`
- Caddyfile: `/opt/genius-certify/proxy/Caddyfile`
- Backup do Caddyfile anterior à mudança:
  `/opt/genius-certify/proxy/Caddyfile.before-studioemar-20260905-192255`

Web e API entram nas redes `studio` e `edge`. O Caddy usa
`edge` para alcançar os containers diretamente. O Postgres
fica somente em `studio` e não publica porta. As portas 3000
e 3001 no host escutam apenas em 127.0.0.1.

Certificados Let's Encrypt emitidos para os dois domínios.
HTTP redireciona para HTTPS; health, CORS, login, dashboard,
listagem de alunos e endpoints do aluno foram validados.
O Genius Certify continuou respondendo após a mudança.

Dados atuais são fictícios e descartáveis. Treinador:
`Elissandro <elissandro@mail.com>`. As senhas aleatórias foram
exibidas somente no deploy e não estão no Git. O reset do
volume `studio_postgres_data` precisa de autorização explícita.

Backup diário às 03:00 UTC em
`/opt/studioemar/infrastructure/backups`, retenção de 14 dias.
O primeiro dump foi restaurado com sucesso em PostgreSQL
temporário isolado. Cópia off-site ainda é pendência.

Operação, atualização, homologação e reset documentados em
`infrastructure/README.md`. A VPS não tem Node/pnpm; nela use
diretamente `docker compose`.

## Não fazer ainda

- join na lista de espera;
- e-mail de recuperação (token existe; sem mailer;
  tela de reset com token não existe);
- Expo / apps/mobile;
- alterações na VPS / Caddy fora do escopo da FASE 9;
- perfil do aluno.

## Pendências

- Sem mailer de recuperação.
- Mergear a branch `fase-9-vps` após revisão.
- Configurar backup off-site antes do uso definitivo.
- Após aceite do cliente, autorizar reset do banco fictício e
  criar o primeiro treinador real.
- Imagem da API tem ~810 MB: o CLI do Prisma e as engines
  respondem pela maior parte. Reduzir só se a VPS apertar.
