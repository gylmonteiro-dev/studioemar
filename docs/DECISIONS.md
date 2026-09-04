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

## ADR-009 — TRAINER e ADMIN no início

Status: ACEITO

Decisão:

No início, TRAINER e ADMIN são o mesmo operador (dono /
professor do Studio).

Os dois papéis permanecem no enum para evolução futura.
A FASE 2 usa somente STUDENT.

---

## ADR-010 — Provisionamento de conta

Status: ACEITO

Decisão:

O professor cria a conta. O aluno não se auto-cadastra.

Após a criação, o aluno define senha no primeiro acesso
e pode recuperar senha.

A FASE 2 cobre essas telas com UI mínima e sessão mock.
Cadastro pelo professor permanece na FASE 3.

JWT real permanece para a FASE 5.

---

## ADR-011 — Paleta oficial e tokens Tailwind

Status: ACEITO

Decisão:

A paleta de docs/DESIGN_SYSTEM.md é a fonte de verdade.

Mapeamento no código:

- laranja EMAR → accent e bg-cta (gradiente)
- preto #050505 → surface-dark nas superfícies;
  primary permanece o botão sólido preto
- texto #111111 → foreground

Não usar --color-primary para o laranja, para não
pintar login e cards escuros.

---

## ADR-012 — Temas light e dark

Status: ACEITO

Decisão:

Dois modos. Dark é o padrão.

Light usa a paleta oficial das seções 3–8.
Dark reusa as mesmas classes Tailwind e troca
as variáveis em html.dark.

Preferência em localStorage (studioemar.theme).
O laranja EMAR não muda entre os modos.

---

## ADR-013 — Prisma em apps/api e passwordHash

Status: ACEITO

Decisão:

O schema Prisma vive em `apps/api/prisma`. Não há pacote
`packages/database`. Só o Nest consome o client.

`User.passwordHash` existe somente na tabela. Não entra no
schema Zod `User` nem nas respostas de domínio.

Motivos:

- um único consumidor do ORM nesta fase;
- o contrato público não carrega credencial;
- a coluna nula evita uma migration só para hash na FASE 5.

JWT e verificação de senha permanecem na FASE 5.

---

## Fora de escopo destas decisões

Não foram decididos ainda:

- detalhes de armazenamento do JWT.

Esses pontos não devem ser assumidos no código.
