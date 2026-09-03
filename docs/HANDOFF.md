# Handoff — Studio EMAR

## Situação atual

FASE 0 concluída e aprovada.

FASE 1 em andamento: tarefas 1 a 5 concluídas.

Monorepo, TypeScript, lint, @studioemar/shared e
Next.js (placeholder) existem. Ainda não há NestJS,
tokens nem componentes.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- package.json raiz com TypeScript, ESLint e Prettier
- @studioemar/shared (esqueleto)
- apps/web (Next.js App Router, página "Studio EMAR")

## Próxima atividade

Aguardar autorização para a tarefa 6 da FASE 1:
NestJS stub em apps/api.

## Não fazer ainda

- NestJS, domínio em shared, tokens, componentes;
- telas de produto;
- regras de cancelamento ou crédito no código;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- aplicativo mobile;
- assumir PEND-001 a PEND-010.

## Pendências

- autorizar tarefa 6 da FASE 1;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
