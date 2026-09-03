# Handoff — Studio EMAR

## Situação atual

FASE 0 concluída e aprovada.

FASE 1 em andamento: tarefas 1 a 7 concluídas.

Monorepo, TypeScript, lint, shared, Next.js, NestJS
e tokens provisórios (Tailwind v4) existem.
Ainda não há componentes fundamentais.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- apps/web com Inter, JetBrains Mono e tokens
  (background, foreground, primary, surface, muted,
  border, accent, success, warning, danger, info, bg-cta)
- apps/api GET /health
- @studioemar/shared (esqueleto)

## Próxima atividade

Aguardar autorização para a tarefa 8 da FASE 1:
componentes fundamentais.

## Não fazer ainda

- componentes de produto, domínio em shared;
- telas dos protótipos;
- regras de cancelamento ou crédito no código;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- aplicativo mobile;
- assumir PEND-001 a PEND-010;
- gravar paleta oficial em DESIGN_SYSTEM.md
  (ainda pendente).

## Pendências

- autorizar tarefa 8 da FASE 1;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
