import { Injectable } from '@nestjs/common';

@Injectable()
export class Clock {
  now(): Date {
    const raw = process.env.CLOCK_NOW;
    if (!raw) {
      return new Date();
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('CLOCK_NOW inválido. Use ISO-8601.');
    }
    return parsed;
  }
}
