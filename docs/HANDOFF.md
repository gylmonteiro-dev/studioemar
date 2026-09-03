# Handoff — Studio EMAR

## Situação atual

FASE 0 e FASE 1 concluídas.

Fundação do monorepo pronta: web, API stub, shared
esqueleto, tokens provisórios e primitives.

A home de apps/web é um sandbox temporário. Remover
antes da FASE 2.

apps/mobile está reservada. Sem Expo.

## Já disponível

- Protótipos HTML em /prototypes
- Análise da FASE 0 aprovada
- Decisões ADR-001 a ADR-008
- apps/web (Next.js + Tailwind + sandbox de primitives)
- apps/api (GET /health)
- packages/shared (esqueleto)
- apps/mobile (README apenas; excluída do pnpm workspace)

## Próxima atividade

Aguardar autorização para a FASE 1b — Contrato de
domínio.

A FASE 1b depende, para crédito e cancelamento, das
regras PEND-001 a PEND-010.

## Não fazer ainda

- telas dos protótipos;
- domínio/Zod sem autorização da 1b;
- Expo / apps/mobile;
- Prisma e banco;
- Docker de produção;
- alterações na VPS;
- alterações no Caddy;
- assumir PEND-001 a PEND-010;
- gravar paleta oficial em DESIGN_SYSTEM.md.

## Pendências

- autorizar FASE 1b;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- validar regras pendentes de negócio (PEND-001 a PEND-010);
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
