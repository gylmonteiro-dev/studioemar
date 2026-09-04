import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RedeemCreditRequest } from '@studioemar/shared';
import { Clock } from '../common/clock';
import { toBooking, toCredit } from '../common/mappers';
import { applySeatChange, isSlotBookable } from '../domain/slot-occupancy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async expireStale(studentId?: string): Promise<void> {
    const now = this.clock.now();
    await this.prisma.credit.updateMany({
      where: {
        status: 'AVAILABLE',
        expiresAt: { lt: now },
        ...(studentId ? { studentId } : {}),
      },
      data: { status: 'EXPIRED' },
    });
  }

  async listMine(studentId: string) {
    await this.expireStale(studentId);
    const credits = await this.prisma.credit.findMany({
      where: { studentId },
      orderBy: { generatedAt: 'desc' },
    });
    return credits.map(toCredit);
  }

  async listAll() {
    await this.expireStale();
    const credits = await this.prisma.credit.findMany({
      orderBy: { generatedAt: 'desc' },
    });
    return credits.map(toCredit);
  }

  async redeem(
    creditId: string,
    studentId: string,
    input: RedeemCreditRequest,
  ) {
    await this.expireStale(studentId);
    const now = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({ where: { id: creditId } });
      if (!credit) {
        throw new NotFoundException('Crédito não encontrado');
      }
      if (credit.studentId !== studentId) {
        throw new ForbiddenException('Sem permissão');
      }
      if (credit.status !== 'AVAILABLE' || credit.expiresAt <= now) {
        throw new ConflictException('Crédito inválido ou expirado');
      }

      const slot = await tx.timeSlot.findUnique({
        where: { id: input.timeSlotId },
      });
      if (!slot) {
        throw new NotFoundException('Horário não encontrado');
      }
      if (!isSlotBookable(slot)) {
        throw new ConflictException('Horário lotado');
      }

      const alreadyBooked = await tx.booking.findFirst({
        where: {
          studentId,
          timeSlotId: slot.id,
          status: 'CONFIRMED',
        },
      });
      if (alreadyBooked) {
        throw new ConflictException('Você já está neste horário');
      }

      const booking = await tx.booking.create({
        data: {
          studentId,
          timeSlotId: slot.id,
          kind: 'MAKEUP',
          status: 'CONFIRMED',
        },
      });

      await tx.credit.update({
        where: { id: credit.id },
        data: {
          status: 'USED',
          usedAt: now,
          usedBookingId: booking.id,
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

  async annul(creditId: string, trainerId: string) {
    await this.expireStale();
    const now = this.clock.now();
    const credit = await this.prisma.credit.findUnique({
      where: { id: creditId },
    });
    if (!credit || credit.status !== 'AVAILABLE') {
      throw new ConflictException('Crédito não pode ser anulado');
    }

    const updated = await this.prisma.credit.update({
      where: { id: creditId },
      data: {
        status: 'ANNULLED',
        annulledAt: now,
        annulledByUserId: trainerId,
      },
    });
    return toCredit(updated);
  }
}
