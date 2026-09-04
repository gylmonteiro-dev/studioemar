import { Injectable } from '@nestjs/common';
import type { OccupancyDashboard } from '@studioemar/shared';
import { Clock } from '../common/clock';
import { computeOccupancy } from '../domain/occupancy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async occupancy(): Promise<OccupancyDashboard> {
    const [timeSlots, bookings, cancellationCount] = await Promise.all([
      this.prisma.timeSlot.findMany(),
      this.prisma.booking.findMany(),
      this.prisma.cancellation.count(),
    ]);

    return computeOccupancy({
      now: this.clock.now(),
      timeSlots,
      bookings,
      cancellationCount,
    });
  }
}
