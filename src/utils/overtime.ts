export interface OvertimeResult {
  regularHours: number; // Decimal hours
  overtimeHours: number; // Decimal hours
}

export function calculateOvertime(
  dateStr: string, 
  startTimeStr: string, 
  endTimeStr: string,
  discountLunch: boolean = true,
  lunchStartStr: string = '12:00',
  lunchEndStr: string = '13:00'
): OvertimeResult {
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
  let endMinutes = parseToMinutes(endTimeStr);

  let totalMinutes = endMinutes - startMinutes;
  if (totalMinutes <= 0) {
    totalMinutes += 24 * 60; // overnight
    endMinutes += 24 * 60;
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

  // Calculate raw regular minutes by finding overlap of [startMinutes, endMinutes] and [regStart, regEnd]
  let rawRegularMinutes = 0;
  if (regStart < regEnd) {
    const overlapStart = Math.max(startMinutes, regStart);
    const overlapEnd = Math.min(endMinutes, regEnd);
    if (overlapStart < overlapEnd) {
      rawRegularMinutes = overlapEnd - overlapStart;
    }
  }

  let rawOvertimeMinutes = totalMinutes - rawRegularMinutes;

  let lunchInRegular = 0;
  let lunchInOvertime = 0;

  if (discountLunch) {
    const lStart = parseToMinutes(lunchStartStr);
    const lEnd = parseToMinutes(lunchEndStr);

    if (lStart < lEnd) {
      // Find overlap of worked period with lunch on Day 1
      const lunchOverlapStart1 = Math.max(startMinutes, lStart);
      const lunchOverlapEnd1 = Math.min(endMinutes, lEnd);
      let day1LunchOverlap = 0;
      if (lunchOverlapStart1 < lunchOverlapEnd1) {
        day1LunchOverlap = lunchOverlapEnd1 - lunchOverlapStart1;
      }

      // Find overlap of worked period with lunch on Day 2 (for overnight shifts)
      const lunchOverlapStart2 = Math.max(startMinutes, lStart + 1440);
      const lunchOverlapEnd2 = Math.min(endMinutes, lEnd + 1440);
      let day2LunchOverlap = 0;
      if (lunchOverlapStart2 < lunchOverlapEnd2) {
        day2LunchOverlap = lunchOverlapEnd2 - lunchOverlapStart2;
      }

      const totalLunchOverlap = day1LunchOverlap + day2LunchOverlap;

      // Now determine how much of that lunch overlap is within regular hours
      // Day 1 Regular hours interval is [regStart, regEnd]
      if (regStart < regEnd) {
        const regLunchStart1 = Math.max(lunchOverlapStart1, regStart);
        const regLunchEnd1 = Math.min(lunchOverlapEnd1, regEnd);
        if (regLunchStart1 < regLunchEnd1) {
          lunchInRegular += (regLunchEnd1 - regLunchStart1);
        }

        // Day 2 Regular hours (if shift goes overnight, we can check if it overlaps with Day 2's regular hours as well)
        const regLunchStart2 = Math.max(lunchOverlapStart2, regStart + 1440);
        const regLunchEnd2 = Math.min(lunchOverlapEnd2, regEnd + 1440);
        if (regLunchStart2 < regLunchEnd2) {
          lunchInRegular += (regLunchEnd2 - regLunchStart2);
        }
      }

      // Anything that is lunch overlap but not in regular hours is in overtime
      lunchInOvertime = totalLunchOverlap - lunchInRegular;
    }
  }

  const finalRegularMinutes = Math.max(0, rawRegularMinutes - lunchInRegular);
  const finalOvertimeMinutes = Math.max(0, rawOvertimeMinutes - lunchInOvertime);

  return {
    regularHours: finalRegularMinutes / 60,
    overtimeHours: finalOvertimeMinutes / 60
  };
}
