/** Consecutive practice days ending today or yesterday (UTC calendar days). */
export function calculateStreak(dates: Date[], now = new Date()): number {
  if (dates.length === 0) return 0;
  const dayKey = (value: Date) => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const unique = [...new Set(dates.map(dayKey))].sort((a, b) => b - a);
  const today = dayKey(now);
  const yesterday = today - 86_400_000;
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 1;
  for (let index = 1; index < unique.length; index++) {
    if (unique[index - 1]! - unique[index]! !== 86_400_000) break;
    streak++;
  }
  return streak;
}

export function utcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
