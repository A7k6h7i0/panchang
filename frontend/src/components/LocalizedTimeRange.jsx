import { getRangeDisplayParts } from "../utils/timeRangeDisplay";

const DATE_HIGHLIGHT_CLASS = "range-date-highlight";
const TIME_HIGHLIGHT_CLASS = "range-time-highlight";
const RANGE_SEPARATOR_CLASS = "range-separator-highlight";

export default function LocalizedTimeRange({
  startIso,
  endIso,
  referenceDate,
  monthNames,
  monthNamesShort,
  className = "text-amber-100/80",
}) {
  const { startDate, startTime, endTime, endDate } = getRangeDisplayParts(
    startIso,
    endIso,
    referenceDate,
    monthNames,
    monthNamesShort
  );

  if (!startDate && !startTime && !endTime && !endDate) return null;

  return (
    <span className={`${className} whitespace-normal break-words leading-tight`}>
      {startDate ? <span className={DATE_HIGHLIGHT_CLASS}>{startDate} </span> : null}
      {startTime ? <span className={TIME_HIGHLIGHT_CLASS}>{startTime}</span> : null}
      {startTime || endTime ? <span className={RANGE_SEPARATOR_CLASS}> - </span> : null}
      {endTime ? <span className={TIME_HIGHLIGHT_CLASS}>{endTime}</span> : null}
      {endDate ? <span className={DATE_HIGHLIGHT_CLASS}> {endDate}</span> : null}
    </span>
  );
}
