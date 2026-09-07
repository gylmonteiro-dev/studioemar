import { Injectable } from '@nestjs/common';
import type { OccupancyDashboard } from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { Clock } from '../common/clock';
import { computeOccupancy } from '../domain/occupancy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async occupancy(actor?: AuthUser): Promise<OccupancyDashboard> {
    const trainerId = actor?.role === 'TRAINER' ? actor.id : undefined;
    const [timeSlots, bookings, cancellationCount] = await Promise.all([
      this.prisma.timeSlot.findMany({
        where: trainerId ? { trainerId } : undefined,
      }),
      this.prisma.booking.findMany({
        where: trainerId ? { timeSlot: { trainerId } } : undefined,
      }),
      this.prisma.cancellation.count({
        where: trainerId
          ? { booking: { timeSlot: { trainerId } } }
          : undefined,
      }),
    ]);

    return computeOccupancy({
      now: this.clock.now(),
      timeSlots,
      bookings,
      cancellationCount,
    });
  }
}
