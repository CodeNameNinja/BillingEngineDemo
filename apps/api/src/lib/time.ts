export function nowIsoUtc(): string {
  return new Date().toISOString();
}

export function addDaysIsoUtc(isoUtc: string, days: number): string {
  const d = new Date(isoUtc);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function isoDateToIsoUtcStart(isoDate: string): string {
  // Interpret as UTC midnight, not local time.
  return new Date(`${isoDate}T00:00:00.000Z`).toISOString();
}

export function isoDateToIsoUtcEndExclusive(isoDate: string): string {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 1);
  return start.toISOString();
}

