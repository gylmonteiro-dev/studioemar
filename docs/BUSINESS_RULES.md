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

# REGRAS PENDENTES

## PEND-001

Qual a antecedência mínima para cancelamento com crédito?

PENDENTE.

## PEND-002

Créditos possuem validade?

PENDENTE.

## PEND-003

Caso possuam validade, qual será?

PENDENTE.

## PEND-004

O treinador poderá conceder crédito manualmente?

PENDENTE.

## PEND-005

O treinador poderá remover crédito?

PENDENTE.

## PEND-006

Como serão tratados feriados?

PENDENTE.

## PEND-007

Como serão tratadas férias/recesso?

PENDENTE.

## PEND-008

Como será tratada falta sem cancelamento?

PENDENTE.

## PEND-009

Haverá lista de espera?

PENDENTE.

## PEND-010

Um aluno poderá utilizar mais de um crédito na mesma semana?

PENDENTE.