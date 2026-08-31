/** Count of Mon–Fri dates in [start, end], inclusive (UTC). */
export function weekdaysBetween(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  const last = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  while (d.getTime() <= last) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

/** Mon–Fri count of the calendar month that `date` falls in (the payroll denominator). */
export function workingDaysInMonthOf(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return weekdaysBetween(
    new Date(Date.UTC(y, m, 1)),
    new Date(Date.UTC(y, m + 1, 0))
  );
}
