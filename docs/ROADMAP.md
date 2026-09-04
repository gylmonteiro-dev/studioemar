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

Telas prototipadas contra mocks tipados.
Primeiro acesso e recuperar senha: UI mínima (RN-022).
Criar conta é do professor (RN-021) — FASE 3.
Perfil do aluno permanece fora (sem protótipo).

O aluno não deve visualizar os demais participantes
do horário.

PEND-004, PEND-005, PEND-007 e PEND-010 aceitas
(RN-017 a RN-020). UI de anular crédito e grantsCredit
no fechamento: FASE 3.

---

## FASE 3 — Frontend treinador

[ ] Dashboard
[ ] Agenda
[ ] Alunos
[ ] Detalhes do aluno
[ ] Configuração da agenda recorrente
[ ] Ocupação
[ ] Créditos
[ ] Configurações

STATUS: NÃO INICIADA

Apenas o dashboard possui protótipo. As demais telas
precisam de referência visual ou aceite explícito de
UI funcional mínima.

---

## FASE 4 — Domínio e banco

[ ] Validar entidades
[ ] Criar modelo ER
[ ] Validar relacionamentos
[ ] PostgreSQL
[ ] Prisma
[ ] Migrations

STATUS: NÃO INICIADA

Depende das regras PEND críticas de cancelamento e crédito.

---

## FASE 5 — Backend

[ ] NestJS (módulos sob demanda)
[ ] Auth
[ ] Users
[ ] Students
[ ] Plans
[ ] Schedule
[ ] Bookings
[ ] Cancellation
[ ] Credits
[ ] Dashboard
[ ] Swagger

STATUS: NÃO INICIADA

Não criar todos os módulos de uma vez.
Começar por auth, students, schedules, bookings e credits.

---

## FASE 6 — Integração

[ ] Frontend + API
[ ] Autenticação
[ ] Agenda real
[ ] Cancelamentos
[ ] Créditos
[ ] Reposição
[ ] Dashboard

---

## FASE 7 — Testes

[ ] Regras de cancelamento
[ ] Créditos
[ ] Capacidade
[ ] Conflitos
[ ] Permissões
[ ] Responsividade
[ ] Fluxos críticos
[ ] Contratos Zod / OpenAPI

---

## FASE 8 — Infraestrutura

[ ] Dockerfile Web
[ ] Dockerfile API
[ ] PostgreSQL
[ ] Docker Compose
[ ] Volumes
[ ] Health checks
[ ] Variáveis
[ ] Backup

---

## FASE 9 — VPS

[ ] Analisar ambiente existente
[ ] Analisar Caddy existente
[ ] Configurar domínio
[ ] Deploy containers
[ ] Configurar proxy
[ ] HTTPS
[ ] Testes
[ ] Backup
[ ] Procedimento de atualização

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
