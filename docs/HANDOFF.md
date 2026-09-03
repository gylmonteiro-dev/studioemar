# Handoff — Studio EMAR

## Situação atual

FASE 0 concluída e aprovada.

FASE 1 em andamento: tarefas 1, 2 e 3 concluídas.

Monorepo, TypeScript compartilhado, ESLint e Prettier
existem. Ainda não há Next.js, NestJS, pacote shared
com código, tokens nem componentes.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- package.json raiz com TypeScript, ESLint e Prettier
- pnpm-workspace.yaml
- tsconfig.base.json e tsconfigs por workspace
- eslint.config.mjs
- .prettierrc e .prettierignore

## Próxima atividade

Aguardar autorização para a tarefa 4 da FASE 1:
esqueleto de packages/shared.

## Não fazer ainda

- Next.js, NestJS, shared com domínio, tokens;
- telas de produto;
- regras de cancelamento ou crédito no código;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- aplicativo mobile;
- assumir PEND-001 a PEND-010.

## Pendências

- autorizar tarefa 4 da FASE 1;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
