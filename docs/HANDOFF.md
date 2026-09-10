# Handoff — Studio EMAR

## Situação atual

FASE 0 a 9 concluídas e mergeadas em main. A homologação
está publicada e disponível para feedback do cliente.

A hierarquia de acesso (RN-023 / RN-024), a gestão de
turmas/horários (RN-025), a identificação das turmas, o
catálogo de tipos de aula, os modelos de plano (RN-026),
o cadastro de aluno com agenda regular, a grade contínua,
as listagens/dashboard por janela (folga de 12 semanas),
a home do aluno por semana, a reposição só com crédito e
o prazo de 4h / validade de 30 dias a partir da aula
estão em `main` e na VPS (`IMAGE_TAG=48a7e74`, 2026-09-10),
com exclusão de aluno (RN-027), o cadastro de horário
iniciando dias desmarcados e limite 4, e ADMIN/SUPERADMIN
como treinadores elegíveis no mesmo login. O Caddy não foi
alterado. Imagens anteriores (`16d8c03`, `b599ff5`, `63f2c41`,
`d062228`, `36a87e8`, `accd322`, `d92705d`) permanecem no host para rollback.

A fatia dos ajustes pós-homologação acrescenta sessão persistente
(localStorage), login por e-mail ou CPF (RN-030), agenda semanal na
ficha do aluno, remarcação da aula regular sem crédito (RN-028),
edição de plano/horários do aluno com reorganização das reservas
(RN-029), cancelamento da aula pelo professor com aviso e escolha de
crédito (RN-031) e edição/exclusão de turma com alunos mediante
confirmação (RN-025 revisada).

Não trabalhar diretamente na main. Criar uma branch nova a
partir dela para os próximos ajustes.

RN-017 a RN-031 aceitas. Papéis: SUPERADMIN, ADMIN, TRAINER
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
- `GET /operators?for=teaching` lista TRAINER, ADMIN e
  SUPERADMIN ativos para turma e vínculo com aluno. Sem o
  parâmetro, a lista continua só as contas gerenciáveis.
  Proprietário/Administrador opera como professor no mesmo login.
- Hub Ajustes em `/treinador/configuracoes` (ADMIN/SUPERADMIN):
  accordion Horários / Planos / Fechamento; query
  `?secao=horarios|planos|fechamento` abre a seção
- Horários saiu da nav do treinador; `/treinador/horarios` e
  `/treinador/agenda-recorrente` redirecionam para Ajustes
- Turmas recorrentes exigem identificação, tipo de aula,
  dias de segunda a domingo, intervalo, capacidade e treinador.
  O formulário inicia com os dias desmarcados e limite 4.
  A grade é contínua: gera uma folga de 12 semanas e materializa
  qualquer semana futura ao listar `GET /time-slots?from&to`.
  Sem `from`/`to`, a listagem e o dashboard devolvem só a folga
  vigente (hoje até +12 semanas), não o histórico. Único em
  `(studioHourId, startsAt)`. Alunos regulares ativos entram nas
  aulas novas (só se a aula for nova ou ainda tiver vaga). Aula
  some da agenda se o aluno for inativado, o horário for
  excluído da grade ou houver fechamento.
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
  cancela as reservas futuras. Excluir (`DELETE /students/:id`)
  é só ADMIN/SUPERADMIN e apaga o cadastro.
- TRAINER vê alunos vinculados ou com reserva em aula ministrada
  por ele; ADMIN e SUPERADMIN mantêm visão global
- Configuração global (horários, planos, fechamentos) restrita a
  ADMIN/SUPERADMIN
- Swagger: http://localhost:3001/docs
- GET /health público: `{ status: "ok", now }`. `now` segue
  `CLOCK_NOW` quando definido. As agendas do aluno e do
  treinador abrem a semana desse relógio, não do browser.
  A home do aluno também lista os treinos por semana.
- Reposição: 1 crédito por aula, só em horário com vaga e fora
  do dia/horário regular do aluno. Sem crédito, o botão
  Agendar reposição fica desabilitado. Após cancelar com
  crédito, o aluno pode marcar a reposição na hora ou depois.
- RN-012: antecedência de 4 horas. RN-013: validade de 30 dias
  a partir do início da aula cancelada. A área de créditos
  destaca os que vencem primeiro e os dias restantes.
- Remarcação (RN-028): `POST /bookings` com `{ timeSlotId }`. Só a
  aula regular que o próprio aluno desmarcou, se ainda houver vaga.
  Não usa crédito; anula o crédito daquela aula se estiver
  disponível e recusa se ele já foi usado em outra reposição. O
  botão Remarcar aparece no detalhe da reserva cancelada.
- Agenda do aluno (RN-029): `PATCH /students/:id` aceita `planId` e
  `regularSlots` (ADMIN/SUPERADMIN). Cancela as reservas futuras que
  saíram da agenda, sem crédito, e inscreve nas turmas novas com
  vaga. O formulário fica na ficha do aluno.
- Login (RN-030): `POST /auth/login` recebe `identifier` (e-mail ou
  CPF, com ou sem máscara) e `password`.
- Cancelar aula (RN-031): `POST /time-slots/:id/cancellations` com
  `{ grantsCredit }`. Fecha a ocorrência (`CLOSED`), cancela as
  reservas e gera crédito só se pedido. TRAINER cancela a aula que
  ministra; ADMIN/SUPERADMIN, qualquer uma.
- Turma com alunos: `PATCH`/`DELETE /studio-hours/:id` respondem 409
  `ENROLLED_STUDENTS` com os totais; `confirmWithEnrolled` confirma
  e cancela as aulas futuras sem crédito.
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
- Cancelar `booking-hoje-sem-credito` = sem crédito (aula a
  menos de 4h do `CLOCK_NOW`)
- Cancelar `booking-seg-com-credito` = com crédito
- Swagger: http://localhost:3001/docs

Sessão: access + refresh em `localStorage`
(`studioemar.session`). Logout só limpa o storage local. Fechar o
navegador ou trocar de aplicativo não desloga (ADR-015 revisado).

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
- Fluxos: login, cancelar (com opção de reposição imediata),
  dashboard, Ajustes (horários, tipo de aula, cadastro de plano),
  agenda e home na semana do relógio do servidor, cadastro de
  aluno (CPF e horários do plano), créditos por vencimento,
  exclusão de aluno (ADMIN)
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

Dados da homologação foram limpos em 2026-09-08 (backup
`studioemar-20260908-150529.sql.gz`). Restou só o SUPERADMIN
`Administrador <admin@nexusgenius.com.br>`; a senha não está
no Git. Não há TRAINER, aluno, plano, tipo de aula nem turma.
O próximo cadastro começa pelo hub Ajustes e por Acessos.
Não executar o seed de homologação nem resetar o volume sem
autorização explícita.

Backup diário às 03:00 UTC em
`/opt/studioemar/infrastructure/backups`, retenção de 14 dias.
O primeiro dump foi restaurado com sucesso em PostgreSQL
temporário isolado. Cópia off-site ainda é pendência.

Operação, atualização, homologação e reset documentados em
`infrastructure/README.md`. A VPS não tem Node/pnpm; nela use
diretamente `docker compose`.

## Ajustes locais após homologação

Começar a próxima conversa lendo este arquivo e os feedbacks
do cliente. `main` e a VPS (`36a87e8`) contêm identificação
de turmas, catálogo de tipos de aula, planos (RN-026), hub
Ajustes, cadastro de aluno com agenda regular, grade contínua,
listagens/dashboard por janela, home do aluno por semana,
reposição só com crédito (fora do horário regular),
RN-012/RN-013 (4h; 30 dias a partir da aula cancelada),
exclusão de aluno (RN-027), o formulário de horário com dias
desmarcados e limite 4, e ADMIN/SUPERADMIN como treinadores
elegíveis (mesmo login).

A semana da agenda e da home (aluno e treinador) usa
`GET /health.now`.

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

Na última validação local da fatia de créditos/home, `pnpm test`,
`pnpm lint`, `pnpm build:api` e `pnpm test:e2e` (28) passaram.
Encerrar `pnpm dev:web` antes de `pnpm build:web` ou de
relançar o e2e.

Deploys na VPS em 2026-09-08 (Caddy intacto; schema up to date):

- `63f2c41` — produto até créditos/home; backup
  `studioemar-20260908-141505.sql.gz`
- `b599ff5` — exclusão de aluno (RN-027)
- limpeza do banco (backup `studioemar-20260908-150529.sql.gz`):
  só SUPERADMIN
- `16d8c03` — dias desmarcados e limite 4 no cadastro de horário;
  backup `studioemar-20260908-150936.sql.gz`
- `36a87e8` — ADMIN/SUPERADMIN como treinadores elegíveis;
  backup `studioemar-20260908-182610.sql.gz`

Deploy em 2026-09-10 (Caddy intacto; sem migration nova):

- `accd322` — ajustes pós-homologação (sessão persistente, login
  por e-mail ou CPF, remarcação, agenda do aluno, cancelamento da
  aula, turma com alunos); backup `studioemar-20260910-034047.sql.gz`
- `d92705d` — turma excluída some da grade; ficha do aluno em
  acordeões com agenda no topo e edição de plano pelo lápis;
  backup `studioemar-20260910-205913.sql.gz`
- `48a7e74` — cancelar/remarcar na agenda do aluno com modal de
  sucesso e sem duplicar o card cancelado; backup
  `studioemar-20260910-212711.sql.gz`

Validado após o último rebuild: health `{ status, now }`, HTTPS,
site e Swagger 200, `prisma migrate status` up to date e o Genius
Certify respondendo. `POST /auth/login` aceita `identifier` com
e-mail ou CPF mascarado e recusa o campo `email` antigo.
`GET /operators?for=teaching` inclui o SUPERADMIN. Não há mais os
quatro papéis de demonstração na VPS; o login de homologação é o
SUPERADMIN.

O rebuild da web na VPS leva cerca de 20 minutos e derruba a sessão
SSH por timeout. A imagem termina mesmo assim: reconecte e confira
`docker images studioemar/web` antes de repetir o build.

As migrations abaixo estão aplicadas no banco local e na VPS:

- `20260905214000_access_hierarchy`
- `20260907210000_studio_hours`
- `20260908103000_studio_hour_name`
- `20260908120000_class_types`
- `20260908140000_plan_metrics`
- `20260908160000_student_regular_slots`
- `20260908180000_timeslot_studio_hour_unique`

No banco **local**, as aulas, reservas, créditos, waitlist e
turmas de demonstração foram removidos, preservando os cinco
usuários, senhas, plano e vínculos. Depois da limpeza foi
cadastrada uma turma manual para teste. Não executar o seed
para preservar esse estado. A VPS não usa esses usuários.

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
   (horários, papéis, planos, cadastro de aluno, grade contínua,
   `health.now`, home por semana e créditos) exige api e web:

   ```
   docker compose -f infrastructure/docker-compose.prod.yml build api
   docker compose -f infrastructure/docker-compose.prod.yml build web
   docker compose -f infrastructure/docker-compose.prod.yml up -d
   docker compose -f infrastructure/docker-compose.prod.yml ps
   ```

   A API aplica `prisma migrate deploy` no entrypoint. As sete
   migrations acima já estão aplicadas na VPS (`36a87e8`).
   Atualize `IMAGE_TAG` no `.env` da VPS para o SHA curto do
   commit publicado.

6. Validar: `GET https://api.studioemar.com.br/health`
   (`status` e `now`); HTTPS; CORS; login SUPERADMIN;
   Ajustes (horários com dias vazios e limite 4, tipos, planos;
   SUPERADMIN escolhível como treinador);
   Acessos para criar TRAINER; cadastro de aluno (mesmo
   SUPERADMIN na lista de professores); exclusão de
   aluno; agendas e home na semana do relógio do servidor.

Não alterar o Caddyfile compartilhado neste deploy. Preservar
os blocos do Studio em `/opt/genius-certify/proxy/Caddyfile`.

As imagens em execução foram construídas no commit `36a87e8`.
Imagens `16d8c03`, `b599ff5`, `63f2c41` e `d062228` ainda
existem no host para rollback.

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
- Configurar backup off-site antes do uso definitivo.
- Homologação limpa: cadastrar TRAINER, tipos, horários, planos
  e alunos pela UI. Não reseedar.
- Imagem da API tem ~810 MB: o CLI do Prisma e as engines
  respondem pela maior parte. Reduzir só se a VPS apertar.
