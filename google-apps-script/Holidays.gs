function listHolidays() {
  return sheetToObjects('Holidays')
    .map((h) => ({ date: String(h.Date), name: h.Name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function holidayDateSet() {
  const set = {};
  listHolidays().forEach((h) => { set[h.date] = h.name; });
  return set;
}

// Leave days actually charged against a balance: a half-day request is
// always 0.5; a full-day request counts every day in range except
// mandatory practice holidays (the office is already closed, so it isn't
// "spent" leave — see the Holidays sheet tab).
function chargeableDays(start, end, halfDay) {
  if (halfDay) return 0.5;
  const holidays = holidayDateSet();
  let cur = new Date(start);
  const last = new Date(end);
  let n = 0;
  while (cur <= last) {
    const key = cur.toISOString().slice(0, 10);
    if (!holidays[key]) n++;
    cur = new Date(cur.getTime() + 86400000);
  }
  return n;
}
