import { HomeAssistant } from "custom-card-helpers";
import { addDays, addMonths, addYears, Day, endOfDay, endOfMonth, endOfQuarter, endOfToday, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfQuarter, startOfToday, startOfWeek, startOfYear, subDays, subMonths, subYears } from "date-fns";
import { getWeekStartByLocale } from "weekstart";
import { DateRange } from "@/enums";
import memoizeOne from "memoize-one";

//================================================================================================================================================================================//

const weekdays: string[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

//================================================================================================================================================================================//

export function calculateDateRange(hass: HomeAssistant, range: DateRange): [Date, Date] {
  const today: Date = new Date();

  switch (range) {
    case DateRange.This_Week: {
      const weekStartsOn: Day = firstWeekdayIndex(hass.locale.language, hass.locale["first_weekday"]);
      return [startOfWeek(today, {weekStartsOn}), endOfWeek(today, {weekStartsOn})];
    }

    case DateRange.This_Month:
      return [startOfMonth(today), endOfMonth(today)];

    case DateRange.This_Quarter:
      return [startOfQuarter(today), endOfQuarter(today)];

    case DateRange.This_Year:
      return [startOfYear(today), endOfYear(today)];

    case DateRange.Last_7_Days:
      return [startOfDay(subDays(today, 7)), endOfDay(today)];

    case DateRange.Last_30_Days:
      return [startOfDay(subDays(today, 30)), endOfDay(today)];

    case DateRange.Last_12_Months:
      return [startOfDay(startOfMonth(subMonths(today, 12))), endOfMonth(subMonths(today, 1))];
  }

  return [startOfToday(), endOfToday()];
}

//================================================================================================================================================================================//

export function calculatePreviousDateRange(range: DateRange, periodStart: Date, periodEnd: Date): [Date, Date] {
  switch (range) {
    case DateRange.Today:
      periodStart = subDays(periodStart, 1);
      periodEnd = subDays(periodEnd, 1);
      break;

    case DateRange.This_Week:
    case DateRange.Last_7_Days:
      periodStart = subDays(periodStart, 7);
      periodEnd = subDays(periodEnd, 7);
      break;

    case DateRange.This_Month:
      periodStart = subMonths(periodStart, 1);
      periodEnd = endOfMonth(subMonths(periodEnd, 1));
      break;

    case DateRange.This_Quarter:
      periodStart = subMonths(periodStart, 3);
      periodEnd = endOfMonth(subMonths(periodEnd, 3));
      break;

    case DateRange.This_Year:
    case DateRange.Last_12_Months:
      periodStart = subYears(periodStart, 1);
      periodEnd = endOfYear(subYears(periodEnd, 1));
      break;

    case DateRange.Last_30_Days:
      periodStart = subDays(periodStart, 30);
      periodEnd = subDays(periodEnd, 30);
      break;
  }

  return [periodStart, periodEnd];
}

//================================================================================================================================================================================//

export function calculateNextDateRange(range: DateRange, periodStart: Date, periodEnd: Date): [Date, Date] {
  switch (range) {
    case DateRange.Today:
      periodStart = addDays(periodStart, 1);
      periodEnd = addDays(periodEnd, 1);
      break;

    case DateRange.This_Week:
    case DateRange.Last_7_Days:
      periodStart = addDays(periodStart, 7);
      periodEnd = addDays(periodEnd, 7);
      break;

    case DateRange.This_Month:
      periodStart = addMonths(periodStart, 1);
      periodEnd = endOfMonth(addMonths(periodEnd, 1));
      break;

    case DateRange.This_Quarter:
      periodStart = addMonths(periodStart, 3);
      periodEnd = endOfMonth(addMonths(periodEnd, 3));
      break;

    case DateRange.This_Year:
    case DateRange.Last_12_Months:
      periodStart = addYears(periodStart, 1);
      periodEnd = endOfYear(addYears(periodEnd, 1));
      break;

    case DateRange.Last_30_Days:
      periodStart = addDays(periodStart, 30);
      periodEnd = addDays(periodEnd, 30);
      break;

  }

  return [periodStart, periodEnd];
}

//================================================================================================================================================================================//

const firstWeekdayIndex = memoizeOne((language: string, firstWeekDay: string): Day => {
  if (firstWeekDay === "language") {
    if ("weekInfo" in Intl.Locale.prototype) {
      return (new Intl.Locale(language)["weekInfo"].firstDay % 7) as Day;
    }

    return (getWeekStartByLocale(language) % 7) as Day;
  }

  return weekdays.includes(firstWeekDay) ? (weekdays.indexOf(firstWeekDay) as Day) : 1;
});

//================================================================================================================================================================================//
