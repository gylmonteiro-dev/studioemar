# Domínio persistido — Studio EMAR

Fonte do vocabulário: schemas Zod em `packages/shared`.
Persistência: Prisma em `apps/api/prisma/schema.prisma`.

`OccupancyDashboard` é consulta. Não é tabela.

Aluno não é entidade própria: é `User` com `role = STUDENT`
(ADR-009).

## Modelo ER

```mermaid
erDiagram
  Plan ||--o{ RecurringSlot : has
  Plan ||--o{ User : "planId opcional"
  User ||--o{ TimeSlot : "trainerId"
  User ||--o{ StudioHour : "trainerId"
  User ||--o{ Booking : "studentId"
  User ||--o{ WaitlistEntry : "studentId"
  User ||--o{ Credit : "studentId"
  User ||--o{ StudioClosure : "createdBy"
  User ||--o{ StudentTrainer : "studentId"
  User ||--o{ StudentTrainer : "trainerId"
  User ||--o{ StudentRegularSlot : "studentId"
  StudioHour ||--o{ StudentRegularSlot : "weekday"
  StudioHour ||--o{ TimeSlot : generates
  TimeSlot ||--o{ Booking : has
  TimeSlot ||--o{ WaitlistEntry : has
  Booking ||--o| Cancellation : "um cancelamento"
  Credit }o--o| Booking : "origin ou used"
  Credit }o--o| StudioClosure : "originClosure"
```

## Entidades

| Tabela | Contrato Zod | Observação |
|---|---|---|
| Plan | Plan | Pacote: aulas/semana, duração, totais mensais (4 semanas) |
| User | User | `passwordHash` e reset token só no banco (ADR-013 / ADR-014). `cpf` único e opcional (obrigatório na criação do aluno) |
| RecurringSlot | RecurringSlot | Agenda regular do plano |
| ClassType | ClassType | Catálogo de tipos de aula; nome único em maiúsculas |
| StudioHour | StudioHour | Turma recorrente do estúdio (`name` + dias + intervalo) |
| TimeSlot | TimeSlot | `enrolledCount` denormalizado; `studioHourId` opcional |
| StudentTrainer | — | Vínculo N:N aluno–treinador (RN-024) |
| StudentRegularSlot | StudentRegularSlot | Agenda semanal do aluno (turma + dia), alinhada ao plano |
| StudioClosure | StudioClosure | Férias/recesso (RN-014 / RN-019) |
| WaitlistEntry | WaitlistEntry | Fila FIFO |
| Booking | Booking | Regular ou reposição |
| Cancellation | Cancellation | Um registro por reserva |
| Credit | Credit | Sem crédito avulso |

## Invariantes

- `User.email` é único.
- `User.cpf` é único quando informado (11 dígitos).
- Crédito deriva de aula ou fechamento (`originBookingId` ou
  `originClosureId`). Não há crédito avulso (RN-017, RN-019).
- Origens: `CANCELLATION`, `TRAINER_CANCELLATION`,
  `CLOSURE_COMPENSATION`.
- Status do crédito: `AVAILABLE`, `USED`, `EXPIRED`, `ANNULLED`.
- `Cancellation.bookingId` é único.
- `WaitlistEntry` é único em `(timeSlotId, studentId)`.
- Recorrência do plano é única em `(planId, weekday, time)`.
- `Plan.name` é único e gravado em maiúsculas.
- Totais mensais do plano: aulas/semana × 4; horas = aulas do mês × duração.
- `ClassType.name` é único e gravado em maiúsculas.
- `StudioHour.classType` e `TimeSlot.classType` repetem o nome
  do catálogo (sem FK nesta fase).
- `StudioHour` gera `TimeSlot`s futuros de forma contínua (folga
  de 12 semanas + materialização da semana consultada); aula
  pontual não tem `studioHourId`. Único em `(studioHourId, startsAt)`.
  Listagens e o dashboard leem só a janela pedida (ou a folga),
  não o histórico inteiro.
- A agenda regular do aluno (`StudentRegularSlot`) é única em
  `(studentId, weekday)` e gera reservas `REGULAR` nas aulas
  futuras da turma.
- Reserva confirmada no mesmo horário: a FASE 5 valida.
  Sem unique parcial no Prisma.

## Fora deste documento

Regras de cancelamento, crédito e capacidade estão no
backend. Helpers no shared só repetem a fórmula (4h / 30d a
partir do início da aula).
