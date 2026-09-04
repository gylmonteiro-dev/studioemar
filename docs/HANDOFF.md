# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b e 2 concluídas.

Frontend aluno em apps/web contra mocks de
@studioemar/shared/mocks. Sem Nest de negócio.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009).

FASE 2 está em main (eb9b5cb), alinhada com origin/main.
A branch fase-2-contrato-regras aponta para o mesmo
commit. Não trabalhar na main. Próxima fatia em
branch nova a partir de eb9b5cb.

## Já disponível

- Telas aluno: login, primeiro acesso, recuperar senha,
  home, agenda, detalhes, cancelamento (12h), créditos,
  horários, confirmar reposição
- Origens de crédito: CANCELLATION, TRAINER_CANCELLATION,
  CLOSURE_COMPENSATION
- Status: AVAILABLE, USED, EXPIRED, ANNULLED
- Paleta oficial aplicada (ADR-011)
- Temas light/dark; dark é o padrão (ADR-012)
- MOCK_NOW = 2026-09-03T15:00:00.000Z

## Demo aluno

- João: joao@studioemar.local — qualquer senha
- Ana (primeiro acesso): ana@studioemar.local
- Cancelar hoje 18:00 → sem crédito
- Cancelar segunda 18:00 (07/09) → com crédito
- Dois créditos disponíveis para reposição na mesma semana

## Próxima atividade

FASE 3 — frontend treinador (dashboard prototipado;
demais telas precisam de UI mínima ou protótipo).

Cadastro de aluno, anular crédito e grantsCredit no
fechamento são FASE 3.

## Não fazer ainda

- Prisma e banco;
- implementar os paths do OpenAPI no Nest;
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno;
- join na lista de espera (só estado LOTADO).

## Pendências

- prototipar ou aceitar UI mínima das telas de treinador;
- JWT real (FASE 5).
