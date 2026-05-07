const EN_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function resolveMonthLabel(monthIndex, monthNames, monthNamesShort) {
  const idx = Number(monthIndex) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx > 11) return "";
  const full = Array.isArray(monthNames) ? String(monthNames[idx] || "").trim() : "";
  if (full) return full;
  const short = Array.isArray(monthNamesShort) ? String(monthNamesShort[idx] || "").trim() : "";
  if (short) return short;
  return EN_MONTH_NAMES[idx] || "";
}

function parseIsoParts(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  return { year, month, day, hour, minute };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function addDays(parts, deltaDays) {
  if (!parts) return null;
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

function parseDateAnchor(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return {
      year: Number(match[3]),
      month: Number(match[2]),
      day: Number(match[1]),
    };
  }

  return null;
}

export function formatDateLabelFromIso(value) {
  const parts = parseIsoParts(value);
  if (!parts) return "";

  const monthName = resolveMonthLabel(parts.month);
  if (!monthName) return "";
  return `${parts.day} ${monthName}, ${parts.year}`;
}

export function formatTimeLabelFromIso(value) {
  const parts = parseIsoParts(value);
  if (!parts) return "";
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function getRangeDisplayParts(startIso, endIso, referenceDate, monthNames, monthNamesShort) {
  const startTime = formatTimeLabelFromIso(startIso);
  const endTime = formatTimeLabelFromIso(endIso);
  const referenceParts = parseDateAnchor(referenceDate);
  const endParts = referenceParts || parseIsoParts(endIso);
  const startParts = endParts ? addDays(endParts, -1) : parseIsoParts(startIso);
  const startDate = startParts
    ? `${startParts.day} ${resolveMonthLabel(startParts.month, monthNames, monthNamesShort)}, ${startParts.year}`.trim()
    : "";
  const endDate = endParts
    ? `${endParts.day} ${resolveMonthLabel(endParts.month, monthNames, monthNamesShort)}, ${endParts.year}`.trim()
    : formatDateLabelFromIso(endIso);

  return {
    startDate,
    startTime,
    endTime,
    endDate,
  };
}

export function formatRangeWithDates(startIso, endIso, referenceDate, monthNames, monthNamesShort) {
  const { startDate, startTime, endTime, endDate } = getRangeDisplayParts(
    startIso,
    endIso,
    referenceDate,
    monthNames,
    monthNamesShort
  );

  if (startDate && startTime && endTime && endDate) {
    return `${startDate} ${startTime} - ${endTime} ${endDate}`;
  }

  if (startDate && startTime) return `${startDate} ${startTime}`;
  if (endDate && endTime) return `${endTime} ${endDate}`;
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startDate || endDate || startTime || endTime || "";
}
