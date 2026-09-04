# Handoff — Studio EMAR

## Situação atual

FASE 0, 1, 1b, 2 e 3 concluídas.

Frontend aluno e treinador em apps/web contra mocks de
@studioemar/shared/mocks. Sem Nest de negócio.

RN-017 a RN-022 aceitas. TRAINER e ADMIN são o mesmo
operador no início (ADR-009).

FASE 3 entra em main neste merge. Não trabalhar na main.
Próxima fatia (FASE 4) em branch nova a partir de main.

## Já disponível

- Telas aluno: login, primeiro acesso, recuperar senha,
  home, agenda, detalhes, cancelamento (12h), créditos,
  horários, confirmar reposição
- Telas treinador: dashboard (Recharts), agenda com
  participantes, lista de espera FIFO (só visualização),
  alunos, cadastro, detalhes, agenda recorrente, ocupação,
  créditos (anular), fechamento com grantsCredit
- Login redireciona por papel: aluno → /aluno;
  TRAINER/ADMIN → /treinador
- Origens de crédito: CANCELLATION, TRAINER_CANCELLATION,
  CLOSURE_COMPENSATION
- Status: AVAILABLE, USED, EXPIRED, ANNULLED
- Paleta oficial aplicada (ADR-011)
- Temas light/dark; dark é o padrão (ADR-012)
- MOCK_NOW = 2026-09-03T15:00:00.000Z

## Demo

- João: joao@studioemar.local — qualquer senha
- Ana (primeiro acesso): ana@studioemar.local
- Carlos (treinador): carlos@studioemar.local — qualquer senha
- Cancelar hoje 18:00 → sem crédito
- Cancelar segunda 18:00 (07/09) → com crédito
- Dois créditos disponíveis para reposição na mesma semana
- Professor cancelar aula do aluno → crédito TRAINER_CANCELLATION
- Fechamento sem grantsCredit → sem crédito; com a opção
  marcada → CLOSURE_COMPENSATION

## Próxima atividade

FASE 4 — domínio e banco (Prisma / PostgreSQL).
Não antecipar Nest de negócio nem paths do OpenAPI.

## Não fazer ainda

- Prisma e banco (FASE 4);
- implementar os paths do OpenAPI no Nest (FASE 5);
- Expo / apps/mobile;
- Docker de produção;
- alterações na VPS / Caddy;
- perfil do aluno;
- join na lista de espera (só visualização FIFO no
  painel do treinador).

## Pendências

- JWT real (FASE 5).
