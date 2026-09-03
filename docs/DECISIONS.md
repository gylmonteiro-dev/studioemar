# Registro de Decisões Técnicas

Este documento registra decisões relevantes e seus motivos.

---

## ADR-001 — PostgreSQL

Status: ACEITO

Decisão:

Utilizar PostgreSQL como banco principal.

Motivos:

- open source;
- robusto;
- sem assinatura obrigatória;
- excelente suporte a aplicações transacionais;
- pode funcionar na própria VPS;
- integração com Prisma;
- possibilidade futura de migrar para serviço gerenciado.

Validado na FASE 0.

---

## ADR-002 — Backend NestJS

Status: ACEITO

Decisão:

Utilizar NestJS + TypeScript.

Motivos:

- mesmo ecossistema TypeScript do frontend;
- arquitetura modular;
- boa organização para crescimento;
- integração com Prisma;
- OpenAPI/Swagger;
- adequado para API utilizada posteriormente pelo mobile.

Validado na FASE 0.

---

## ADR-003 — React Native + Expo

Status: ACEITO

O aplicativo mobile será desenvolvido após estabilização
da versão web.

Web e mobile utilizarão a mesma API.

Validado na FASE 0. Não antecipar a FASE 10.

---

## ADR-004 — Caddy

Status: DEFINIDO

Utilizar o Caddy já existente na VPS.

Não adicionar Caddy específico ao projeto sem necessidade.

---

## ADR-005 — Containers

Status: ACEITO

Produção deverá utilizar containers separados para:

Web
API
PostgreSQL

Validado na FASE 0. Docker de produção permanece na FASE 8.

---

## ADR-006 — Monorepo

Status: ACEITO

Decisão:

Organizar o repositório como monorepo com pnpm workspaces.

Estrutura:

```
apps/web
apps/api
apps/mobile
packages/shared
infrastructure
docs
prototypes
```

Motivos:

- um time e um produto;
- tipos e validações compartilhados entre Next, Nest e,
  futuramente, Expo;
- mudança de regra sobe schema, API e UI no mesmo PR;
- Docker Compose e deploy na VPS a partir da raiz;
- mobile futuro consome o pacote shared sem publicar
  pacote privado;
- baixo custo operacional.

Não compartilhar componentes React nem CSS entre web e
mobile.

Critério para rever: times distintos ou ciclos de release
independentes. Hoje nenhum dos dois existe.

---

## ADR-007 — Pacote shared

Status: ACEITO

Decisão:

Criar `packages/shared` para tipos TypeScript, enums,
constantes de domínio e schemas Zod.

O NestJS e o Next.js deverão consumir esse pacote.
O Expo também o consumirá na FASE 10.

Motivos:

- backend é a autoridade das regras, mas o contrato
  precisa ser o mesmo nos clientes;
- evita o frontend da FASE 2 nascer desconectado da API.

O esqueleto nasce na FASE 1.
O vocabulário de domínio entra na FASE 1b.

---

## ADR-008 — Um app Next.js para web

Status: ACEITO

Decisão:

Aluno e treinador convivem no mesmo app Next.js,
separados por rota e layout.

Motivos:

- um único deploy web na VPS;
- mesma autenticação e design tokens;
- não justifica dois apps web neste momento.

---

## Fora de escopo destas decisões

Não foram decididos ainda:

- paleta oficial (DESIGN_SYSTEM.md continua pendente);
- PEND-001 a PEND-010 em BUSINESS_RULES.md;
- self-registration versus cadastro pelo treinador;
- detalhes de armazenamento do JWT;
- se TRAINER e ADMIN são o mesmo operador no início.

Esses pontos não devem ser assumidos no código.
