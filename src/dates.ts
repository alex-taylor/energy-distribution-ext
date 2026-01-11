import { HomeAssistant } from "custom-card-helpers";
import { Day, endOfDay, endOfMonth, endOfQuarter, endOfToday, endOfWeek, endOfYear, endOfYesterday, startOfDay, startOfMonth, startOfQuarter, startOfToday, startOfWeek, startOfYear, startOfYesterday, subDays, subMonths } from "date-fns";
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
    case DateRange.Yesterday:
      return [startOfYesterday(), endOfYesterday()];

    case DateRange.This_Week:
      const weekStartsOn: Day = firstWeekdayIndex(hass.locale.language, hass.locale["first_weekday"]);
      return [startOfWeek(today, { weekStartsOn }), endOfWeek(today, { weekStartsOn })];

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
