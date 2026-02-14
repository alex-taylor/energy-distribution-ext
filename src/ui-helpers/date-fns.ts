import { DateRange } from "@/enums";
import { isFirstDayOfMonth, isLastDayOfMonth, isSameDay, isSameMonth, isSameYear } from "date-fns";
import memoizeOne from "memoize-one";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";

//================================================================================================================================================================================//

const isFirstDayOfYear = (date: Date): boolean => date.getMonth() === 0 && date.getDate() === 1;
const isLastDayOfYear = (date: Date): boolean => date.getMonth() === 11 && date.getDate() === 31;

const dateFormatterFull = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric", month: "long", day: "numeric" }));
const dateFormatterYearMonth = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric", month: "long" }));
const dateFormatterMonthDay = memoizeOne(language => new Intl.DateTimeFormat(language, { month: "long", day: "numeric" }));
const dateFormatterYear = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric" }));
const dateFormatterMonth = memoizeOne(language => new Intl.DateTimeFormat(language, { month: "long" }));
const dateFormatterDay = memoizeOne(language => new Intl.DateTimeFormat(language, { day: "numeric" }));

//================================================================================================================================================================================//

export const renderDateRange = memoizeOne((language: string, start: Date, end: Date): string => {
  const fullYear: boolean = isFirstDayOfYear(start) && isLastDayOfYear(end);
  const fullMonth: boolean = isFirstDayOfMonth(start) && isLastDayOfMonth(end);
  const sameYear: boolean = isSameYear(start, end);
  const sameMonth: boolean = isSameMonth(start, end);
  const sameDay: boolean = isSameDay(start, end);
  let formatStart: Intl.DateTimeFormat;
  let formatEnd: Intl.DateTimeFormat;

  if (fullYear) {
    if (sameYear) {
      return dateFormatterYear(language).format(start);
    }

    formatStart = formatEnd = dateFormatterYear(language);
  } else if (fullMonth) {
    if (sameMonth) {
      return dateFormatterYearMonth(language).format(start);
    }

    formatStart = sameYear ? dateFormatterMonth(language) : dateFormatterYearMonth(language);
    formatEnd = dateFormatterYearMonth(language);
  } else if (sameMonth) {
    if (sameDay) {
      return dateFormatterFull(language).format(start);
    }

    formatStart = dateFormatterDay(language);
    formatEnd = dateFormatterFull(language);
  } else {
    formatStart = sameYear ? dateFormatterMonthDay(language) : dateFormatterFull(language);
    formatEnd = dateFormatterFull(language);
  }

  return `${formatStart.format(start)} – ${formatEnd.format(end)}`;
});

//================================================================================================================================================================================//

export function getRangePresetName(hass: HomeAssistant, range: DateRange): string {
  return range === DateRange.From_Date_Picker ? localize("editor.from_date_picker") : hass.localize(`ui.components.date-range-picker.ranges.${range}`);
}

//================================================================================================================================================================================//
