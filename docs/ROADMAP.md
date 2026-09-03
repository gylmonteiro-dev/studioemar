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
- Design System analisado: paleta oficial ainda pendente.
  Tokens da FASE 1 devem partir de
  `prototypes/studio_emar_athletics/DESIGN.md` até a paleta
  oficial ser inserida.
- Regras PEND-001 a PEND-010 continuam abertas e não devem
  ser assumidas no código.

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

Tokens usam DESIGN.md como base provisória.
Paleta oficial em DESIGN_SYSTEM.md continua pendente.

Não inclui: domínio completo, Prisma, auth real,
telas de produto, Docker de produção, VPS.

A home de apps/web é um sandbox temporário e deve
ser removida antes da FASE 2.

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
PEND-004, PEND-005, PEND-007 e PEND-010 continuam abertas.

---

## FASE 2 — Frontend aluno

[ ] Login
[ ] Home
[ ] Agenda
[ ] Detalhes da aula
[ ] Cancelamento
[ ] Créditos
[ ] Horários disponíveis
[ ] Reposição
[ ] Perfil (somente se o fluxo for definido)

STATUS: NÃO INICIADA

Implementar apenas telas já prototipadas, contra mocks
tipados da FASE 1b.

Perfil, recuperar senha e criar conta não têm protótipo
e dependem de decisão de produto.

O aluno não deve visualizar os demais participantes
do horário.

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
