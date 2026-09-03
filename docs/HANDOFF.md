# Handoff — Studio EMAR

## Situação atual

FASE 0, FASE 1 e FASE 1b concluídas.

Contrato de domínio está em @studioemar/shared
(tipos, Zod, constantes 12h/30d e helpers).

A home de apps/web continua um sandbox temporário.
Remover antes da FASE 2.

## Já disponível

- Vocabulário: Plan, RecurringSlot, TimeSlot, Booking,
  Cancellation, Credit, WaitlistEntry, StudioClosure
- Helpers: isCancellationEligibleForCredit, creditExpiresAt
- Mocks em @studioemar/shared/mocks
- Contrato HTTP em docs/openapi.yaml
- RN-012 a RN-016 aceitas
- apps/api ainda só expõe GET /health

## Próxima atividade

Aguardar autorização para a FASE 2 — Frontend aluno.

## Não fazer ainda

- telas dos protótipos sem autorização;
- Prisma e banco;
- implementar os paths do OpenAPI no Nest;
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- assumir PEND-004, PEND-005, PEND-007, PEND-010.

## Pendências

- autorizar FASE 2;
- inserir paleta oficial em DESIGN_SYSTEM.md;
- PEND-004, PEND-005, PEND-007, PEND-010;
- decidir criar conta / recuperar senha / perfil;
- decidir se TRAINER e ADMIN são o mesmo operador;
- prototipar ou aceitar UI mínima das telas de treinador
  que não existem em /prototypes.
