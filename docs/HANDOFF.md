# Handoff — Studio EMAR

## Situação atual

FASE 0 concluída e aprovada.

FASE 1 em andamento: tarefas 1 e 2 concluídas.

Monorepo e TypeScript compartilhado existem.
Ainda não há lint, Next.js, NestJS, pacote shared
com código, tokens nem componentes.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- package.json raiz (private) com TypeScript ~5.7.3
- pnpm-workspace.yaml
- tsconfig.base.json (strict)
- tsconfig.json na raiz, em apps/web, apps/api e
  packages/shared
- Pastas apps/mobile e infrastructure reservadas

## Próxima atividade

Aguardar autorização para a tarefa 3 da FASE 1:
lint e formatação.

## Não fazer ainda

- lint, Next.js, NestJS, shared com código, tokens;
- telas de produto;
- regras de cancelamento ou crédito no código;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- aplicativo mobile;
- assumir PEND-001 a PEND-010.

## Pendências

- autorizar tarefa 3 da FASE 1;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
