import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  creditExpiresAt,
  isCancellationEligibleForCredit,
} from '@studioemar/shared';
import { Clock } from '../common/clock';
import { toBooking, toCancellation } from '../common/mappers';
import { applySeatChange } from '../domain/slot-occupancy';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async listMine(studentId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { studentId },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startsAt: 'asc' } },
    });
    return bookings.map((row) => toBooking(row));
  }

  async cancel(bookingId: string, actor: AuthUser) {
    const now = this.clock.now();
    const isTrainer = actor.role === 'TRAINER' || actor.role === 'ADMIN';

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
            expiresAt: creditExpiresAt(now),
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
