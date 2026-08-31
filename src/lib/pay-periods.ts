import type { CutoffType } from "@/generated/prisma/client";

export interface CutoffParams {
  payDelayDays?: number;
  periodLengthDays?: number; // CUSTOM only
}

export interface PeriodBounds {
  startDate: Date;
  endDate: Date;
  payDate: Date;
}

function endOfMonth(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0));
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function atUTCMidnight(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/** Yields successive {startDate, endDate} boundaries starting from the config's anchor date, indefinitely. */
export function* iteratePeriods(
  type: CutoffType,
  anchorDate: Date,
  params: CutoffParams | null | undefined
): Generator<{ startDate: Date; endDate: Date }> {
  const anchor = atUTCMidnight(anchorDate);

  if (type === "SEMI_MONTHLY") {
    let year = anchor.getUTCFullYear();
    let month = anchor.getUTCMonth();
    while (true) {
      yield {
        startDate: new Date(Date.UTC(year, month, 1)),
        endDate: new Date(Date.UTC(year, month, 15)),
      };
      yield {
        startDate: new Date(Date.UTC(year, month, 16)),
        endDate: endOfMonth(year, month),
      };
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  } else if (type === "BIWEEKLY") {
    let start = anchor;
    while (true) {
      const end = addDays(start, 13);
      yield { startDate: start, endDate: end };
      start = addDays(start, 14);
    }
  } else if (type === "WEEKLY") {
    let start = anchor;
    while (true) {
      const end = addDays(start, 6);
      yield { startDate: start, endDate: end };
      start = addDays(start, 7);
    }
  } else {
    const len = Math.max(1, params?.periodLengthDays ?? 30);
    let start = anchor;
    while (true) {
      const end = addDays(start, len - 1);
      yield { startDate: start, endDate: end };
      start = addDays(start, len);
    }
  }
}

/**
 * Generates the next `count` periods strictly after `after` (or from the anchor if omitted).
 * `after` should be the startDate of the most recently generated period.
 */
export function generateUpcomingPeriods(
  config: {
    type: CutoffType;
    anchorDate: Date;
    params: CutoffParams | null | undefined;
  },
  count: number,
  after?: Date
): PeriodBounds[] {
  const results: PeriodBounds[] = [];
  const payDelayDays = config.params?.payDelayDays ?? 5;

  for (const period of iteratePeriods(
    config.type,
    config.anchorDate,
    config.params
  )) {
    if (after && period.startDate <= after) continue;
    results.push({
      ...period,
      payDate: addDays(period.endDate, payDelayDays),
    });
    if (results.length >= count) break;
  }

  return results;
}

/** Prisma date filter covering a pay period's full range, inclusive of endDate's calendar day. */
export function periodDateFilter(period: { startDate: Date; endDate: Date }) {
  return {
    gte: period.startDate,
    lt: addDays(atUTCMidnight(period.endDate), 1),
  };
}
