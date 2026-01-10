import { html, TemplateResult, svg, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { FlowLine, Segment, SegmentGroup } from ".";
import { CIRCLE_STROKE_WIDTH_SEGMENTS, DOT_RADIUS } from "@/const";
import { CssClass, DateRange, InactiveFlowsMode, Scale } from "@/enums";
import { EditorPages, EnergyFlowCardExtConfig, FlowsOptions, AppearanceOptions } from "@/config";
import { DEFAULT_CONFIG, getConfigValue } from "@/config/config";
import { isFirstDayOfMonth, isLastDayOfMonth, isSameDay, isSameMonth, isSameYear } from "date-fns";
import memoizeOne from "memoize-one";
import { localize } from "../localize/localize";
import { HomeAssistant } from "custom-card-helpers";

const INTER_GROUP_ARC: number = 7.5;
const INTER_SEGMENT_ARC: number = INTER_GROUP_ARC / 3;

const isFirstDayOfYear = (date: Date): boolean => date.getMonth() === 0 && date.getDate() === 1;
const isLastDayOfYear = (date: Date): boolean => date.getMonth() === 11 && date.getDate() === 31;

//================================================================================================================================================================================//

export function renderFlowLines(config: EnergyFlowCardExtConfig, lines: FlowLine[]): TemplateResult {
  const inactiveFlowsMode: InactiveFlowsMode = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Inactive_Flows]);
  const animationEnabled: boolean = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Animation]);

  return html`
    <svg class="lines" xmlns="http://www.w3.org/2000/svg">
    ${repeat(lines, _ => undefined, (_, index) => {
    const line: FlowLine = lines[index];
    let cssLine: string = line.cssLine;

    if (!line.active && cssLine !== CssClass.Hidden_Path) {
      switch (inactiveFlowsMode) {
        case InactiveFlowsMode.Dimmed:
          cssLine += " " + CssClass.Dimmed;
          break;

        case InactiveFlowsMode.Greyed:
          cssLine = CssClass.Inactive;
          break;
      }
    }

    return svg`<path class="${cssLine}" d="${line.path}"></path>`;
  })}
    ${animationEnabled ?
      repeat(lines, _ => undefined, (_, index) => {
        const line: FlowLine = lines[index];

        return svg`
          ${line.active
            ?
            svg`
              <circle r="${DOT_RADIUS}" class="${line.cssDot}">
                <animateMotion path="${line.path}" dur="${Math.abs(line.animDuration)}s" repeatCount="indefinite" calcMode="linear" keyPoints="${line.animDuration < 0 ? '1;0' : '0;1'}" keyTimes="0; 1"></animateMotion>
              </circle>
            `
            : nothing}
        `;
      })
      : nothing}
    </svg>
  `;
}

//================================================================================================================================================================================//

export function renderSegmentedCircle(config: EnergyFlowCardExtConfig, segmentGroups: SegmentGroup[], size: number, startingAngle: number, interSegmentGaps: boolean): TemplateResult {
  const inactiveFlowsMode: InactiveFlowsMode = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Inactive_Flows]);
  const scale: Scale = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Scale]);

  const centre: number = size / 2;
  const radius: number = (size - CIRCLE_STROKE_WIDTH_SEGMENTS) / 2;
  const circumference: number = 2 * radius * Math.PI;

  const interGroupArc: number = segmentGroups.length > 1 ? INTER_GROUP_ARC : 0;
  const interGroupLength: number = circumference * interGroupArc / 360;

  const interSegmentArc: number = interSegmentGaps ? INTER_SEGMENT_ARC : 0;
  const interSegmentLength: number = circumference * interSegmentArc / 360;

  const groupArc: number = 360 / segmentGroups.length - interGroupArc;
  const groupLength: number = circumference * groupArc / 360;

  const startingOffset: number = circumference * -(startingAngle + interGroupArc / 2) / 360;
  let offset: number = startingOffset;
  let length: number = 0;

  return html`
  <svg>
  ${repeat(
    segmentGroups,
    _ => undefined,
    (_, groupIdx) => {
      const group: SegmentGroup = segmentGroups[groupIdx];
      let activeSegments: number = 0;
      let stateTotal: number = 0;

      group.segments.forEach(segment => {
        if (segment.state > 0) {
          stateTotal += scale === Scale.Linear ? segment.state : Math.log(segment.state);
          activeSegments++;
        }
      });

      if (activeSegments === 0) {
        let cssFlow: string = group.inactiveCss;

        switch (inactiveFlowsMode) {
          case InactiveFlowsMode.Dimmed:
            cssFlow += " " + CssClass.Dimmed;
            break;

          case InactiveFlowsMode.Greyed:
            cssFlow = CssClass.Inactive;
            break;
        }

        return svg`
          <circle
            class="${cssFlow}"
            cx = "${centre}"
            cy = "${centre}"
            r = "${radius}"
            stroke-dasharray="${groupLength} ${circumference - groupLength}"
            stroke-dashoffset="${(groupIdx + 1) * (groupLength + interGroupLength) - circumference + startingOffset}"
            shape-rendering="geometricPrecision"
          />
        `;
      }

      const totalSegmentLengths: number = groupLength - (activeSegments === 1 ? 0 : (activeSegments - (segmentGroups.length === 1 ? 0 : 1)) * interSegmentLength);
      let segmentToRender: number = 0;

      return html`
      ${repeat(
        group.segments,
        _ => undefined,
        (_, segmentIdx) => {
          const segment: Segment = group.segments[segmentIdx];

          if (segmentIdx === 0) {
            offset = groupIdx * (groupLength + interGroupLength) + startingOffset + interGroupLength;
          }

          if (segment.state === 0) {
            return ``;
          }

          const interSegmentGap: number = segmentToRender++ > 0 || segmentGroups.length === 1 ? interSegmentLength : 0;
          length = (scale === Scale.Linear ? segment.state : Math.log(segment.state)) / stateTotal * totalSegmentLengths;
          offset += interSegmentGap + length;

          return svg`
          <circle
            class="${segment.cssClass}"
            cx = "${centre}"
            cy = "${centre}"
            r = "${radius}"
            stroke-dasharray="${length} ${circumference - length}"
            stroke-dashoffset="${offset - circumference}"
            shape-rendering="geometricPrecision"
          />
          `;
        }
      )}
      `;
    }
  )}
  </svg>
  `;
}

//================================================================================================================================================================================//

const dateFormatterFull = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric", month: "long", day: "numeric" }));
const dateFormatterYearMonth = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric", month: "long" }));
const dateFormatterMonthDay = memoizeOne(language => new Intl.DateTimeFormat(language, { month: "long", day: "numeric" }));
const dateFormatterYear = memoizeOne(language => new Intl.DateTimeFormat(language, { year: "numeric" }));
const dateFormatterMonth = memoizeOne(language => new Intl.DateTimeFormat(language, { month: "long" }));
const dateFormatterDay = memoizeOne(language => new Intl.DateTimeFormat(language, { day: "numeric" }));

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
