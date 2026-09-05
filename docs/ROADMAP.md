# Roadmap — Studio EMAR

## FASE 0 — Descoberta e análise

[x] Analisar HTMLs
[x] Mapear páginas
[x] Mapear componentes
[x] Identificar dependências existentes
[x] Avaliar responsividade
[x] Validar arquitetura
[x] Decidir monorepo
[x] Analisar Design System

STATUS: CONCLUÍDA E APROVADA

### Conclusões aprovadas

- 9 telas HTML cobrem o fluxo do aluno e um dashboard inicial
  do treinador. Telas de gestão (alunos, agenda recorrente,
  perfil, auth complementar) não existem nos protótipos.
- Os HTMLs são referência visual. Não copiar HTML para React.
  Extrair componentes reutilizáveis.
- Tailwind permanece, compilado no Next.js — sem CDN.
- Inter e JetBrains Mono permanecem, via `next/font`.
- Material Symbols não permanece. Ícones via Lucide React.
- Imagens `aida-public` e assets remotos não vão para produção.
- Recharts somente no dashboard do treinador.
- Backend é a autoridade de cancelamento, crédito, capacidade
  e permissões.
- Monorepo com pnpm workspaces.
- Um único app Next.js para aluno e treinador.
- Pacote `packages/shared` para tipos e validações Zod.
- Design System analisado: paleta oficial em
  docs/DESIGN_SYSTEM.md (ADR-011).
- PEND-004, PEND-005, PEND-007 e PEND-010 foram aceitas
  na FASE 2 (RN-017 a RN-020).

---

## FASE 1 — Fundação

[x] Criar monorepo (pnpm workspaces)
[x] Configurar TypeScript compartilhado
[x] Configurar lint e formatação
[x] Configurar Next.js em apps/web
[x] Configurar NestJS stub em apps/api
[x] Criar packages/shared (esqueleto)
[x] Configurar Tailwind e Design Tokens
[x] Criar componentes fundamentais
[x] Reservar pasta apps/mobile

STATUS: CONCLUÍDA

Tokens usam a paleta oficial de DESIGN_SYSTEM.md (ADR-011).

Não inclui: domínio completo, Prisma, auth real,
telas de produto, Docker de produção, VPS.

A home de apps/web era um sandbox temporário.
Removida na FASE 2.

---

## FASE 1b — Contrato de domínio

[x] Definir vocabulário (Booking, Credit, TimeSlot, Plan)
[x] Schemas Zod compartilhados
[x] OpenAPI mínimo
[x] Mocks tipados para o frontend

STATUS: CONCLUÍDA

Constantes de regra no shared:

- CANCELLATION_CREDIT_DEADLINE_HOURS = 12 (RN-012)
- CREDIT_VALIDITY_DAYS = 30 (RN-013)

OpenAPI estático em docs/openapi.yaml.
Mocks em @studioemar/shared/mocks.

Não inclui Prisma nem persistência.
PEND-004, PEND-005, PEND-007 e PEND-010 aceitas (RN-017 a RN-020).

---

## FASE 2 — Frontend aluno

[x] Login
[x] Primeiro acesso (definir senha)
[x] Recuperar senha (UI mínima)
[x] Home
[x] Agenda
[x] Detalhes da aula
[x] Cancelamento
[x] Créditos
[x] Horários disponíveis
[x] Reposição

STATUS: CONCLUÍDA

Mergeada em main (eb9b5cb).

Telas prototipadas contra mocks tipados.
Primeiro acesso e recuperar senha: UI mínima (RN-022).
Criar conta é do professor (RN-021) — feito na FASE 3.
Perfil do aluno permanece fora (sem protótipo).

O aluno não deve visualizar os demais participantes
do horário.

PEND-004, PEND-005, PEND-007 e PEND-010 aceitas
(RN-017 a RN-020). UI de anular crédito e grantsCredit
no fechamento: feita na FASE 3.

---

## FASE 3 — Frontend treinador

[x] Dashboard
[x] Agenda
[x] Alunos
[x] Detalhes do aluno
[x] Configuração da agenda recorrente
[x] Ocupação
[x] Créditos
[x] Configurações

STATUS: CONCLUÍDA

Dashboard a partir do protótipo (componentes + tokens +
Recharts). Demais telas: UI funcional mínima aceita.
Cadastro de aluno, anular crédito e grantsCredit no
fechamento. Sem copiar HTML de /prototypes.

Login do treinador: carlos@studioemar.local.

---

## FASE 4 — Domínio e banco

[x] Validar entidades
[x] Criar modelo ER
[x] Validar relacionamentos
[x] PostgreSQL
[x] Prisma
[x] Migrations

STATUS: CONCLUÍDA

Nove tabelas alinhadas ao Zod. ER em docs/DOMAIN.md.
Prisma em apps/api. Postgres local via
infrastructure/docker-compose.dev.yml (porta 5434).
Seed a partir de @studioemar/shared/mocks.

Não inclui módulos Nest de negócio nem paths OpenAPI.

---

## FASE 5 — Backend

[x] NestJS (módulos sob demanda)
[x] Auth
[x] Users
[x] Students
[x] Plans
[x] Schedule
[x] Bookings
[x] Cancellation
[x] Credits
[x] Dashboard
[x] Swagger (só a fatia implementada)

STATUS: CONCLUÍDA NA FATIA AUTORIZADA

Módulos: auth, students, schedules, bookings, credits.
JWT real (ADR-014). GET /health intacto.
GET /plans vive no módulo de students (cadastro).
Users = GET /me no módulo de auth.

GET /dashboard entrou na FASE 6 (módulo Nest + OpenAPI).

Fora desta fatia original: join na waitlist,
e-mail de recuperação, ligar o frontend (FASE 6).

---

## FASE 6 — Integração

[x] Frontend + API
[x] Autenticação
[x] Agenda real
[x] Cancelamentos
[x] Créditos
[x] Reposição
[x] Dashboard

STATUS: CONCLUÍDA E MERGEADA EM MAIN

Web consome a API Nest com JWT no sessionStorage (ADR-014 / ADR-015).
GET /dashboard (TRAINER/ADMIN). Sem join na waitlist e sem e-mail
de recuperação.

---

## FASE 7 — Testes

[x] Regras de cancelamento
[x] Créditos
[x] Capacidade
[x] Conflitos
[x] Permissões
[x] Responsividade
[x] Fluxos críticos
[x] Contratos Zod / OpenAPI

STATUS: CONCLUÍDA

Suíte sem Docker: `pnpm test` (shared + API + web unitário).
E2E Playwright (login, cancelamento, permissões, viewports
390/768/1024/1440): `pnpm test:e2e`.

Backend continua a autoridade (serviço Nest + Prisma em
memória nos testes). O e2e cobre a UI com a API mockada.

---

## FASE 8 — Infraestrutura

[x] Dockerfile Web
[x] Dockerfile API
[x] PostgreSQL
[x] Docker Compose
[x] Volumes
[x] Health checks
[x] Variáveis
[x] Backup

STATUS: CONCLUÍDA

`infrastructure/docker-compose.prod.yml` sobe studio-postgres,
studio-api e studio-web. Web e API só escutam em 127.0.0.1;
o Postgres fica na rede interna, sem porta publicada.

Imagens multi-stage: API NestJS com `prisma migrate deploy` no
entrypoint, web com output standalone do Next. Volume nomeado
`studio_postgres_data`. Health check nos três serviços, com
ordem de subida garantida pelo Compose.

Variáveis em `infrastructure/.env` (modelo em `.env.example`).
Backup e restore em `infrastructure/scripts`, com retenção.

Detalhes operacionais em infrastructure/README.md.
Publicar na VPS e configurar o Caddy continua sendo a FASE 9.

---

## FASE 9 — VPS

[x] Analisar ambiente existente
[x] Analisar Caddy existente
[x] Configurar domínio
[x] Deploy containers
[x] Configurar proxy
[x] HTTPS
[x] Testes
[x] Backup
[x] Procedimento de atualização

STATUS: CONCLUÍDA EM HOMOLOGAÇÃO

Web em `https://studioemar.com.br` e API em
`https://api.studioemar.com.br`. O Caddy compartilhado roda em container
e acessa web/API pela rede externa `edge`; PostgreSQL permanece isolado
na rede `studio`.

Stack publicada em `/opt/studioemar`, com certificados Let's Encrypt,
dados fictícios e credenciais aleatórias. Backup diário às 03:00 UTC,
retenção de 14 dias e restore validado em PostgreSQL isolado.

Antes do uso definitivo: autorizar o reset destrutivo do volume do Studio,
inicializar o primeiro treinador real e configurar cópia off-site dos
dumps.

Não modificar o Caddy sem análise prévia.
Não afetar outras aplicações da VPS.

---

## FASE 10 — Mobile

[ ] React Native
[ ] Expo
[ ] Autenticação
[ ] Agenda
[ ] Cancelamentos
[ ] Créditos
[ ] Reposição
[ ] Perfil
[ ] Android
[ ] iOS

Consumirá a mesma API e o pacote shared.
Não antecipar esta fase.
