# Handoff — Studio EMAR

## Situação atual

FASE 0 concluída e aprovada.

FASE 1 em andamento: tarefas 1 a 6 concluídas.

Monorepo, TypeScript, lint, @studioemar/shared,
Next.js (placeholder) e NestJS (health) existem.
Ainda não há tokens nem componentes.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- package.json raiz com TypeScript, ESLint e Prettier
- @studioemar/shared (esqueleto)
- apps/web (Next.js, página "Studio EMAR")
- apps/api (NestJS, GET /health na porta 3001)

## Próxima atividade

Aguardar autorização para a tarefa 7 da FASE 1:
Tailwind e Design Tokens.

## Não fazer ainda

- tokens, componentes, domínio em shared;
- telas de produto;
- regras de cancelamento ou crédito no código;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- aplicativo mobile;
- assumir PEND-001 a PEND-010.

## Pendências

- autorizar tarefa 7 da FASE 1;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
