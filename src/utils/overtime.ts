export interface OvertimeResult {
  regularHours: number; // Decimal hours
  overtimeHours: number; // Decimal hours
}

export function calculateOvertime(dateStr: string, startTimeStr: string, endTimeStr: string): OvertimeResult {
  // Parse date safely
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { regularHours: 0, overtimeHours: 0 };
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day, 12, 0, 0); // Use noon to avoid timezone shift
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Helper to parse HH:MM to minutes from midnight
  const parseToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  const startMinutes = parseToMinutes(startTimeStr);
  const endMinutes = parseToMinutes(endTimeStr);

  const totalMinutes = endMinutes - startMinutes;
  if (totalMinutes <= 0) {
    return { regularHours: 0, overtimeHours: 0 };
  }

  // Define regular interval for each day of the week:
  // - 1 to 4 (Monday to Thursday): 07:00 to 17:00 (420 to 1020 mins)
  // - 5 (Friday): 07:00 to 16:00 (420 to 960 mins)
  // - 0 and 6 (Sunday and Saturday): No regular interval
  let regStart = 0;
  let regEnd = 0;

  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    regStart = 7 * 60; // 420
    regEnd = 17 * 60; // 1020
  } else if (dayOfWeek === 5) {
    regStart = 7 * 60; // 420
    regEnd = 16 * 60; // 960
  }

  // Calculate regular minutes by finding overlap of [startMinutes, endMinutes] and [regStart, regEnd]
  let regularMinutes = 0;
  if (regStart < regEnd) {
    const overlapStart = Math.max(startMinutes, regStart);
    const overlapEnd = Math.min(endMinutes, regEnd);
    if (overlapStart < overlapEnd) {
      regularMinutes = overlapEnd - overlapStart;
    }
  }

  const overtimeMinutes = totalMinutes - regularMinutes;

  return {
    regularHours: regularMinutes / 60,
    overtimeHours: overtimeMinutes / 60
  };
}
