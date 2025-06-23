import { fromUnixTime, parse, isValid, eachDayOfInterval, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function timestampToGreekTime(timestamp: number): {
  time: string;
  date: string;
} {
  const dateObject = fromUnixTime(timestamp);
  const [date, time] = formatInTimeZone(dateObject, "Europe/Athens", "yyyy-MM-dd HH:mm").split(" ");
  return { time, date };
}

export function timestampToDateString(timestamp: number): string {
  return format(timestamp, "yyyy-MM-dd");
}

/**
  @param dateString Accepted format: YYYY-MM-DD
*/
export function dateStringToTimestamp(dateString: string): number {
  return parse(dateString, "yyyy-MM-dd", new Date()).getTime();
}

/**
  @param dateString Accepted format: YYYY-MM-DD
*/
export function validateInputDate(dateString: string): boolean {
  return isValid(parse(dateString, "yyyy-MM-dd", new Date()));
}

export function dateRangeToArray(fromDate: string, toDate: string): string[] {
  return eachDayOfInterval({
    start: dateStringToTimestamp(fromDate),
    end: dateStringToTimestamp(toDate),
  }).map((date) => {
    return timestampToDateString(date.getTime());
  });
}
