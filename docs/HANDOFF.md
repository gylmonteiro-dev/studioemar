# Handoff — Studio EMAR

## Situação atual

FASE 0 a 8 concluídas e mergeadas em main (`3df6f0e`).
A fatia atual é a FASE 9 (VPS), ainda não iniciada.

Frontend aluno e treinador em apps/web contra a API Nest.
JWT no sessionStorage (ADR-015). GET /dashboard no Nest.
A stack de produção já roda em containers (FASE 8), mas só
foi validada localmente: nada foi publicado na VPS.

Não trabalhar na main. Próxima fatia (FASE 9) em branch
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
Não há seed em produção.

`NEXT_PUBLIC_API_URL` é build arg: trocar o domínio exige
`pnpm prod:build`, não só restart. `WEB_ORIGIN` é o CORS
da API e precisa bater com o domínio da web.

Operação detalhada em infrastructure/README.md.

## Próxima atividade — FASE 9 (VPS)

Começar em conversa nova, em branch nova a partir de main.
Antes de codar, ler docs/AGENTS.MD, docs/ARCHITECTURE.md,
docs/ROADMAP.md e infrastructure/README.md.

Objetivo: publicar a stack da FASE 8 na VPS, atrás do Caddy
que já existe lá, com HTTPS e rotina de atualização.

Checklist do ROADMAP: analisar ambiente existente; analisar
Caddy existente; configurar domínio; deploy dos containers;
configurar proxy; HTTPS; testes; backup; procedimento de
atualização.

### Levantar com o Gyl antes de propor qualquer coisa

A VPS não está descrita no repositório. Confirmar, sem
adivinhar:

- como acessar (host, usuário, sudo);
- distribuição, e se já há Docker e Compose instalados;
- onde mora o Caddy (pacote do sistema ou container) e o
  caminho do Caddyfile;
- quais aplicações já rodam lá e quais portas locais estão
  ocupadas — o Compose quer 3000 e 3001 em 127.0.0.1;
- os domínios da web e da API, e se o DNS já aponta;
- se o Caddy já resolve certificado/ACME sozinho;
- onde guardar os dumps e se já existe rotina de backup.

### O que a FASE 8 já entrega para essa fase

- `infrastructure/docker-compose.prod.yml` sobe os três
  containers;
- web em 127.0.0.1:3000 e API em 127.0.0.1:3001, que são
  exatamente os alvos de `reverse_proxy` (ADR-017);
- `WEB_PORT` e `API_PORT` remapeiam essas portas se já
  estiverem ocupadas na VPS;
- Postgres sem porta publicada, só na rede interna;
- `infrastructure/.env.example` lista todas as variáveis;
- backup com retenção e exemplo de cron no
  infrastructure/README.md;
- atualização: `git pull && pnpm prod:build && pnpm prod:up`.

### Cuidados

- Não alterar o Caddyfile sem ler o que já está lá e sem
  autorização: outras aplicações dependem dele (ADR-004).
- Não mexer em nada da VPS fora do escopo do Studio EMAR.
- `NEXT_PUBLIC_API_URL` é build arg: definir o domínio real
  antes do `pnpm prod:build`, senão a web chama a API errada.
- `WEB_ORIGIN` precisa ser o domínio da web, ou o CORS barra.
- Trocar todos os segredos do `.env.example`
  (`openssl rand -base64 48`). Não versionar o `.env`.
- Backup antes de qualquer atualização que traga migration.

Planeje primeiro. Não avance sozinho.

## Não fazer ainda

- join na lista de espera;
- e-mail de recuperação (token existe; sem mailer;
  tela de reset com token não existe);
- Expo / apps/mobile;
- alterações na VPS / Caddy fora do escopo da FASE 9;
- perfil do aluno.

## Pendências

- Sem mailer de recuperação.
- FASE 9 (VPS, domínio e Caddy) não iniciada.
- Imagem da API tem ~810 MB: o CLI do Prisma e as engines
  respondem pela maior parte. Reduzir só se a VPS apertar.
