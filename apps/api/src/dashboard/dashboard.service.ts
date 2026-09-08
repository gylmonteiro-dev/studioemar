import { Injectable } from '@nestjs/common';
import type { OccupancyDashboard } from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { calendarDate, civilRangeBounds } from '../common/calendar-date';
import { Clock } from '../common/clock';
import { computeOccupancy } from '../domain/occupancy';
import { lookAheadEndDate } from '../domain/studio-hours';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async occupancy(actor?: AuthUser): Promise<OccupancyDashboard> {
    const now = this.clock.now();
    const trainerId = actor?.role === 'TRAINER' ? actor.id : undefined;
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        startsAt: civilRangeBounds(calendarDate(now), lookAheadEndDate(now)),
        ...(trainerId ? { trainerId } : {}),
      },
    });
    const slotIds = timeSlots.map((slot) => slot.id);
    const bookings =
      slotIds.length === 0
        ? []
        : await this.prisma.booking.findMany({
            where: { timeSlotId: { in: slotIds } },
          });
    const bookingIds = bookings.map((booking) => booking.id);
    const cancellationCount =
      bookingIds.length === 0
        ? 0
        : await this.prisma.cancellation.count({
            where: { bookingId: { in: bookingIds } },
          });

    return computeOccupancy({
      now,
      timeSlots,
      bookings,
      cancellationCount,
    });
  }
}
