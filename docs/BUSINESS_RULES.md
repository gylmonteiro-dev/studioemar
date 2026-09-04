# Regras de Negócio — Studio EMAR

Status:

EM VALIDAÇÃO

As regras marcadas como PENDENTE não devem ser assumidas pelo código
sem decisão.

---

## RN-001 — Agenda recorrente

A agenda regular do aluno é definida pelo treinador conforme o pacote
contratado.

Exemplo:

Plano: 3x por semana

SEG 18:00
QUA 18:00
SEX 17:00

---

## RN-002 — Reserva regular

As aulas da programação regular possuem vagas reservadas para o aluno.

---

## RN-003 — Cancelamento

O aluno poderá cancelar uma aula previamente agendada.

---

## RN-004 — Crédito por cancelamento

Se o cancelamento ocorrer dentro do prazo permitido, o aluno recebe
um crédito de reposição.

---

## RN-005 — Cancelamento fora do prazo

Se o cancelamento ocorrer depois do prazo permitido, não deverá gerar
crédito.

O sistema deverá informar isso antes da confirmação.

---

## RN-006 — Liberação da vaga

Quando uma aula for cancelada, a vaga deverá ser disponibilizada
conforme as regras do Studio.

---

## RN-007 — Utilização do crédito

Um crédito poderá ser utilizado para reservar uma aula disponível.

---

## RN-008 — Capacidade

Cada horário possui capacidade máxima.

O sistema não deverá permitir reservas acima da capacidade.

---

## RN-009 — Consumo do crédito

Ao confirmar uma reposição:

1 crédito disponível
↓
reserva confirmada
↓
1 crédito consumido

---

## RN-010 — Rastreabilidade

Créditos não deverão existir somente como um número no cadastro do
aluno.

Cada crédito deverá possuir histórico.

Exemplo:

Origem
Data de geração
Aula que originou
Validade
Status
Data de utilização
Aula de utilização

---

## RN-011 — Histórico

O sistema deverá preservar histórico de:

- agendamentos;
- cancelamentos;
- créditos;
- utilização de créditos;
- reposições.

---

## RN-012 — Antecedência para crédito

Status: ACEITO

O aluno só recebe crédito se cancelar com antecedência mínima de
12 horas em relação ao início da aula.

Constante compartilhada:

CANCELLATION_CREDIT_DEADLINE_HOURS = 12

---

## RN-013 — Validade do crédito

Status: ACEITO

O crédito possui validade de 30 dias a partir da data de geração.

Constante compartilhada:

CREDIT_VALIDITY_DAYS = 30

---

## RN-014 — Fechamento do Studio

Status: ACEITO

Feriados e demais fechamentos são informados pelo professor
(administrador do Studio) quando o Studio for fechado.

Não utilizar calendário automático de feriados nacionais.

---

## RN-015 — Falta sem cancelamento

Status: ACEITO

A falta sem cancelamento não gera crédito de reposição.

---

## RN-016 — Lista de espera

Status: ACEITO

Haverá lista de espera por ordem de chegada (FIFO).

O aluno não visualiza os demais participantes. O treinador pode
visualizar a fila.

---

## RN-017 — Origem do crédito

Status: ACEITO (ex-PEND-004)

Não há crédito avulso concedido pelo professor.

O crédito deriva sempre de uma aula:

- o aluno cancela dentro do prazo (RN-012); ou
- o professor cancela a aula do aluno.

Origens no contrato:

CANCELLATION
TRAINER_CANCELLATION

---

## RN-018 — Anulação de crédito

Status: ACEITO (ex-PEND-005)

O professor pode anular um crédito já gerado.

A anulação permanece no histórico (status ANNULLED).

A interface de anulação pertence ao painel do treinador.

---

## RN-019 — Férias e recesso

Status: ACEITO (ex-PEND-007)

Férias e recesso são um fechamento informado pelo professor
(RN-014). Não geram crédito por padrão.

O professor pode, naquele fechamento, optar por compensar com
crédito (grantsCredit). Essa compensação não é um botão genérico
de crédito avulso.

Origem no contrato:

CLOSURE_COMPENSATION

A interface dessa opção pertence ao painel do treinador.

---

## RN-020 — Vários créditos na mesma semana

Status: ACEITO (ex-PEND-010)

O aluno pode possuir e utilizar mais de um crédito na mesma
semana. Não há teto semanal.

---

## RN-021 — Criação de conta

Status: ACEITO

Quem cria a conta do aluno é o administrador / professor.

Não há auto-cadastro.

---

## RN-022 — Senha do aluno

Status: ACEITO

Depois que o professor cria o usuário, o aluno define uma senha
pessoal no primeiro acesso.

O aluno pode recuperar a senha.

---

# REGRAS PENDENTES

Nenhuma pendência crítica de cancelamento ou crédito permanece
aberta. Paleta oficial, JWT e telas de treinador sem protótipo
continuam fora deste documento.
