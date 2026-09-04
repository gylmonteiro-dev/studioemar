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
  User ||--o{ Booking : "studentId"
  User ||--o{ WaitlistEntry : "studentId"
  User ||--o{ Credit : "studentId"
  User ||--o{ StudioClosure : "createdBy"
  TimeSlot ||--o{ Booking : has
  TimeSlot ||--o{ WaitlistEntry : has
  Booking ||--o| Cancellation : "um cancelamento"
  Credit }o--o| Booking : "origin ou used"
  Credit }o--o| StudioClosure : "originClosure"
```

## Entidades

| Tabela | Contrato Zod | Observação |
|---|---|---|
| Plan | Plan | Frequência semanal do pacote |
| User | User | `passwordHash` só no banco (ADR-013) |
| RecurringSlot | RecurringSlot | Agenda regular do plano |
| TimeSlot | TimeSlot | `enrolledCount` denormalizado |
| StudioClosure | StudioClosure | Férias/recesso (RN-014 / RN-019) |
| WaitlistEntry | WaitlistEntry | Fila FIFO |
| Booking | Booking | Regular ou reposição |
| Cancellation | Cancellation | Um registro por reserva |
| Credit | Credit | Sem crédito avulso |

## Invariantes

- `User.email` é único.
- Crédito deriva de aula ou fechamento (`originBookingId` ou
  `originClosureId`). Não há crédito avulso (RN-017, RN-019).
- Origens: `CANCELLATION`, `TRAINER_CANCELLATION`,
  `CLOSURE_COMPENSATION`.
- Status do crédito: `AVAILABLE`, `USED`, `EXPIRED`, `ANNULLED`.
- `Cancellation.bookingId` é único.
- `WaitlistEntry` é único em `(timeSlotId, studentId)`.
- Recorrência é única em `(planId, weekday, time)`.
- Reserva confirmada no mesmo horário: a FASE 5 valida.
  Sem unique parcial no Prisma.

## Fora deste documento

Regras de cancelamento, crédito e capacidade continuam no
backend (FASE 5). Helpers no shared só repetem a fórmula
(12h / 30d).
