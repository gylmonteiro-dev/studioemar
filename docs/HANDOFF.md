# Handoff — Studio EMAR

## Situação atual

FASE 0 a 9 concluídas e mergeadas em main. A homologação
está publicada e disponível para feedback do cliente.

A hierarquia de acesso (RN-023 / RN-024), a gestão de
turmas/horários (RN-025), a identificação das turmas, o
catálogo de tipos de aula e os modelos de plano (RN-026)
estão em `main`. A VPS ainda executa a imagem do `d062228`,
anterior a todos esses ajustes. Ainda não houve deploy.

Não trabalhar diretamente na main. Criar uma branch nova a
partir dela para os próximos ajustes.

RN-017 a RN-026 aceitas. Papéis: SUPERADMIN, ADMIN, TRAINER
e STUDENT. SUPERADMIN herda ADMIN e TRAINER; ADMIN herda
TRAINER; STUDENT permanece isolado (ADR-009). Prisma em
apps/api; passwordHash só no banco (ADR-013). JWT no JSON
(ADR-014). Sessão web: ADR-015.

## Já disponível

- Telas aluno e treinador contra a API (sem `mock-api.ts`)
- Cliente `apps/web/src/lib/api-client.ts` (Bearer + refresh
  em 401)
- Contrato Zod + OpenAPI (health, auth, students, operators,
  schedules, bookings, credits, dashboard, class-types, plans,
  agenda regular do aluno)
- Prisma com vínculo N:N `StudentTrainer`, turmas `StudioHour`,
  catálogo `ClassType`, métricas de `Plan`, CPF do aluno e
  `StudentRegularSlot`
- Prisma schema, migrations e seed
- Compose só do banco: infrastructure/docker-compose.dev.yml
- Nest: auth, students, operators, schedules, bookings, credits,
  dashboard
- Controle de acessos em `/treinador/acessos`
- Hub Ajustes em `/treinador/configuracoes` (ADMIN/SUPERADMIN):
  accordion Horários / Planos / Fechamento; query
  `?secao=horarios|planos|fechamento` abre a seção
- Horários saiu da nav do treinador; `/treinador/horarios` e
  `/treinador/agenda-recorrente` redirecionam para Ajustes
- Turmas recorrentes exigem identificação, tipo de aula,
  dias de segunda a domingo, intervalo, capacidade e treinador.
  A grade é contínua: gera uma folga de 12 semanas e materializa
  qualquer semana futura ao listar `GET /time-slots?from&to`.
  Alunos regulares ativos entram nas aulas novas. Aula some da
  agenda se o aluno for inativado, o horário for excluído da
  grade ou houver fechamento.
- Tipo de aula vem de catálogo (`GET/POST /class-types`); nome
  único em maiúsculas; o admin cadastra o tipo se ainda não
  existir
- Horários pontuais podem ser incluídos pela agenda
- Turmas paralelas são permitidas; a web alerta sobre coincidência
  de dias/intervalos, mas permite confirmar o cadastro
- Planos (RN-026): nome único em maiúsculas, aulas/semana (1–7),
  duração em passos de 30 min (padrão 60), totais com mês = 4
  semanas, preço opcional. CRUD ADMIN; DELETE 409 se houver aluno
- Agenda recorrente do plano (`RecurringSlot`) permanece na API;
  a UI saiu do accordion Horários
- Cadastro de aluno (ADMIN/TRAINER): nome completo, CPF válido,
  e-mail, plano, professores e N dias/horários com vaga
  (N = aulas/semana do plano). Gera reservas REGULAR. Senha no
  primeiro acesso pelo e-mail. Inativar (`PATCH /students/:id`)
  cancela as reservas futuras.
- TRAINER vê alunos vinculados ou com reserva em aula ministrada
  por ele; ADMIN e SUPERADMIN mantêm visão global
- Configuração global (horários, planos, fechamentos) restrita a
  ADMIN/SUPERADMIN
- Swagger: http://localhost:3001/docs
- GET /health público: `{ status: "ok", now }`. `now` segue
  `CLOCK_NOW` quando definido. As agendas do aluno e do
  treinador abrem a semana desse relógio, não do browser.
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

Seed: João, Carlos, Marina e Administrador com senha
`studioemar`; Ana em primeiro acesso (`passwordHash` null);
créditos nas 3 origens; fechamento sem crédito;
waitlist FIFO no slot lotado. Plano de exemplo:
`3X POR SEMANA`.

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
RN-012 (preview de crédito no cancelamento). A semana da
agenda não depende disso: ela lê `GET /health`.

http://localhost:3000 — senha `studioemar`:

- João: joao@studioemar.local / studioemar
- Ana (1º acesso): ana@studioemar.local
- Carlos: carlos@studioemar.local / studioemar
- Marina (ADMIN/proprietária): marina@studioemar.local / studioemar
- Administrador (SUPERADMIN): admin@studioemar.local / studioemar
- Cancelar `booking-hoje-sem-credito` = sem crédito
- Cancelar `booking-seg-com-credito` = com crédito
- Swagger: http://localhost:3001/docs

Sessão: access + refresh em `sessionStorage`
(`studioemar.session`). Logout só limpa o storage local.

Se a :3000 falhar com `.next` (ENOENT), reiniciar
`pnpm dev:web`. Se a :3001 estiver com processo antigo,
reiniciar a API.

Não manter mais de um `next dev` no mesmo checkout. Encerrar
`pnpm dev:web` antes de `pnpm build:web` ou `pnpm test:e2e`,
pois esses processos compartilham o cache `.next`.

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
- Permissões (hierarquia dos quatro papéis, escopo do treinador,
  prevenção de escalada e rotas aluno/operador)
- Responsividade 390 / 768 / 1024 / 1440
- Fluxos: login, cancelar, dashboard, Ajustes (horários, tipo de
  aula, cadastro de plano), agenda na semana do relógio do
  servidor, cadastro de aluno (CPF e horários do plano)
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
- Projeto: `/opt/studioemar`, branch `main`
- Caddy compartilhado: container `nexus_caddy`
- Caddyfile: `/opt/genius-certify/proxy/Caddyfile`
- Backup do Caddyfile anterior à mudança:
  `/opt/genius-certify/proxy/Caddyfile.before-studioemar-20260905-192255`

O checkout `/opt/genius-certify` ficou com o Caddyfile modificado
e a cópia acima não rastreada. Preservar os blocos do Studio
antes de qualquer atualização daquele repositório.

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

## Ajustes locais após homologação

Começar a próxima conversa lendo este arquivo e os feedbacks
do cliente. `main` contém identificação de turmas, catálogo
de tipos de aula, planos (RN-026) e o hub Ajustes.

A semana da agenda (aluno e treinador) usa `GET /health.now`.
Essa fatia está em `main`; a VPS continua no `d062228`.

Fazer os próximos ajustes primeiro apenas localmente. Não
alterar a VPS, o Caddy nem os dados de homologação sem pedido
explícito. Para validar:

```
pnpm test
pnpm lint
pnpm build:api
pnpm build:web
pnpm test:e2e
```

Na última validação, `pnpm test`, `pnpm lint` e os testes E2E
do hub Ajustes (horários, tipo de aula, cadastro de plano)
passaram. Depois, `pnpm test` voltou a passar com
`GET /health.now` e a semana da agenda. O e2e dessa fatia
existe (`agenda abre na semana do relógio do servidor`); não
relançar com `pnpm dev:web` ativo.

As migrations abaixo estão aplicadas no banco local:

- `20260905214000_access_hierarchy`
- `20260907210000_studio_hours`
- `20260908103000_studio_hour_name`
- `20260908120000_class_types`
- `20260908140000_plan_metrics`
- `20260908160000_student_regular_slots`

As aulas, reservas, créditos, waitlist e turmas de demonstração
foram removidos, preservando os cinco usuários, senhas, plano e
vínculos. Depois da limpeza foi cadastrada uma turma manual para
teste. Não executar o seed para preservar esse estado.

`pnpm format:check` ainda aponta arquivos antigos; não formatar
o repositório inteiro como efeito colateral.

Checklist para publicar na VPS (somente com autorização):

1. Local: `pnpm test`, `pnpm lint`, `pnpm build:api`,
   `pnpm build:web`, `pnpm test:e2e`. Encerrar `pnpm dev:web`
   antes do build/e2e.
2. Pedir autorização antes de commit/push. Não trabalhar na
   `main`; mergear a branch aprovada.
3. Na VPS, backup antes de qualquer migration:

   ```
   cd /opt/studioemar
   bash infrastructure/scripts/backup.sh
   ```

4. Atualizar o checkout só com fast-forward:

   ```
   git pull --ff-only origin main
   ```

5. Rebuild das imagens afetadas. Troca de
   `NEXT_PUBLIC_API_URL` exige rebuild da web. Esta fatia
   (horários, papéis, planos e, quando mergeada, `health.now`)
   exige api e web:

   ```
   docker compose -f infrastructure/docker-compose.prod.yml build api
   docker compose -f infrastructure/docker-compose.prod.yml build web
   docker compose -f infrastructure/docker-compose.prod.yml up -d
   docker compose -f infrastructure/docker-compose.prod.yml ps
   ```

   A API aplica `prisma migrate deploy` no entrypoint. Pendentes
   na VPS (imagem `d062228`):

   - `20260905214000_access_hierarchy`
   - `20260907210000_studio_hours`
   - `20260908103000_studio_hour_name`
   - `20260908120000_class_types`
   - `20260908140000_plan_metrics`
   - `20260908160000_student_regular_slots`

6. Validar: `GET https://api.studioemar.com.br/health`
   (`status` e, após o merge desta fatia, `now`); HTTPS; CORS;
   login dos quatro papéis; Ajustes (horários, tipos, planos)
   como ADMIN; TRAINER sem configuração global; agendas na
   semana do relógio do servidor.

Não alterar o Caddyfile compartilhado neste deploy. Preservar
os blocos do Studio em `/opt/genius-certify/proxy/Caddyfile`.

As imagens atualmente em execução foram construídas no commit
`d062228`. Hierarquia de acesso, horários, identificação, tipos
de aula e planos são mudanças funcionais posteriores e exigem
migration, rebuild e validação antes de entrarem na VPS.

## Não fazer ainda

- join na lista de espera;
- e-mail de recuperação (token existe; sem mailer;
  tela de reset com token não existe);
- Expo / apps/mobile;
- alterações na VPS / Caddy fora do escopo da FASE 9;
- perfil do aluno;
- cobrança / uso do preço do plano;
- reexpor a agenda recorrente do plano na UI (API permanece).

## Pendências

- Sem mailer de recuperação.
- Publicar hierarquia de acesso, horários, identificação, tipos
  de aula e planos na VPS após autorização. Backup antes das
  migrations `20260905214000_access_hierarchy`,
  `20260907210000_studio_hours`,
  `20260908103000_studio_hour_name`, `20260908120000_class_types`
  e `20260908140000_plan_metrics`,
  `20260908160000_student_regular_slots`.
- `GET /health.now` e a semana da agenda estão em `main`; não
  publicar na VPS sem autorização.
- Configurar backup off-site antes do uso definitivo.
- Após aceite do cliente, autorizar reset do banco fictício e
  criar o primeiro treinador real.
- Imagem da API tem ~810 MB: o CLI do Prisma e as engines
  respondem pela maior parte. Reduzir só se a VPS apertar.
