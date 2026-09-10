import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  creditExpiresAt,
  isOperatorRole,
  isCancellationEligibleForCredit,
  isOwnRegularTrainingSlot,
  type CreateBookingRequest,
  type Weekday,
} from '@studioemar/shared';
import {
  calendarDate,
  clockTimeSaoPaulo,
  weekdayFromCalendarDate,
} from '../common/calendar-date';
import { Clock } from '../common/clock';
import { toBooking, toCancellation } from '../common/mappers';
import { StudentAccessService } from '../common/student-access.service';
import { applySeatChange, isSlotBookable } from '../domain/slot-occupancy';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly access?: StudentAccessService,
  ) {}

  async listMine(studentId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { studentId },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startsAt: 'asc' } },
    });
    return bookings.map((row) => toBooking(row));
  }

  async rebookRegular(studentId: string, input: CreateBookingRequest) {
    const now = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({
        where: { id: input.timeSlotId },
      });
      if (!slot) {
        throw new NotFoundException('Horário não encontrado');
      }
      if (slot.startsAt <= now) {
        throw new ConflictException('Esta aula já começou');
      }
      if (!isSlotBookable(slot)) {
        throw new ConflictException('Não há vaga nesta turma');
      }

      const confirmed = await tx.booking.findFirst({
        where: {
          studentId,
          timeSlotId: slot.id,
          status: 'CONFIRMED',
        },
      });
      if (confirmed) {
        throw new ConflictException('Você já está neste horário');
      }

      const cancelled = await tx.booking.findFirst({
        where: {
          studentId,
          timeSlotId: slot.id,
          status: 'CANCELLED',
          kind: 'REGULAR',
        },
        include: { cancellation: { include: { credit: true } } },
        orderBy: { id: 'desc' },
      });
      if (!cancelled) {
        throw new ConflictException(
          'Só é possível remarcar uma aula regular que você desmarcou',
        );
      }

      const regulars = await tx.studentRegularSlot.findMany({
        where: { studentId },
        include: { studioHour: true },
      });
      const matches = regulars.map((row) => ({
        weekday: row.weekday as Weekday,
        startTime: row.studioHour.startTime,
      }));
      const weekday = weekdayFromCalendarDate(calendarDate(slot.startsAt));
      const startTime = clockTimeSaoPaulo(slot.startsAt);
      if (!isOwnRegularTrainingSlot(weekday, startTime, matches)) {
        throw new ConflictException(
          'Remarcação sem crédito só vale no horário regular',
        );
      }

      const originCredit = cancelled.cancellation?.credit;
      if (originCredit?.status === 'USED') {
        throw new ConflictException(
          'Você já usou o crédito desta aula em uma reposição',
        );
      }
      if (originCredit?.status === 'AVAILABLE') {
        await tx.credit.update({
          where: { id: originCredit.id },
          data: {
            status: 'ANNULLED',
            annulledAt: now,
            annulledByUserId: studentId,
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          studentId,
          timeSlotId: slot.id,
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      });
      const next = applySeatChange(slot, 1);
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: next,
      });
      return toBooking(booking);
    });
  }

  async cancel(bookingId: string, actor: AuthUser) {
    const now = this.clock.now();
    const isTrainer = isOperatorRole(actor.role);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { timeSlot: true, cancellation: true },
      });
      if (!booking) {
        throw new NotFoundException('Reserva não encontrada');
      }
      if (!isTrainer && booking.studentId !== actor.id) {
        throw new ForbiddenException('Sem permissão');
      }
      if (actor.role === 'TRAINER' && this.access) {
        await this.access.assertCanAccess(actor, booking.studentId);
      }
      if (booking.status !== 'CONFIRMED' || booking.cancellation) {
        throw new ConflictException('Reserva não pode ser cancelada');
      }

      const generatedCredit = isTrainer
        ? true
        : isCancellationEligibleForCredit(now, booking.timeSlot.startsAt);
      const source = isTrainer ? 'TRAINER_CANCELLATION' : 'CANCELLATION';

      let creditId: string | undefined;
      if (generatedCredit) {
        const credit = await tx.credit.create({
          data: {
            studentId: booking.studentId,
            source,
            generatedAt: now,
            originBookingId: booking.id,
            expiresAt: creditExpiresAt(booking.timeSlot.startsAt),
            status: 'AVAILABLE',
          },
        });
        creditId = credit.id;
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      const cancellation = await tx.cancellation.create({
        data: {
          bookingId: booking.id,
          cancelledAt: now,
          cancelledBy: isTrainer ? 'TRAINER' : 'STUDENT',
          generatedCredit,
          creditId,
        },
      });

      const next = applySeatChange(booking.timeSlot, -1);
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: next,
      });

      return toCancellation(cancellation);
    });
  }
}
