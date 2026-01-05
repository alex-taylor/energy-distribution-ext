import { html, TemplateResult, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { FlowLine, Segment, SegmentGroup } from ".";
import { CIRCLE_STROKE_WIDTH_SEGMENTS, DEFAULT_CONFIG, DOT_RADIUS } from "@/const";
import { CssClass, InactiveFlowsMode, Scale } from "@/enums";
import { EditorPages, EnergyFlowCardExtConfig, FlowsOptions, AppearanceOptions } from "@/config";
import { getConfigValue } from "@/config/config";

const INTER_GROUP_ARC: number = 7.5;
const INTER_SEGMENT_ARC: number = INTER_GROUP_ARC / 3;

//================================================================================================================================================================================//

export function renderFlowLines(config: EnergyFlowCardExtConfig, lines: FlowLine[]): TemplateResult {
  const inactiveFlowsMode: InactiveFlowsMode = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Inactive_Flows]);
  const animationEnabled: boolean = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Animation]);

  return html`
    <svg class="lines" xmlns="http://www.w3.org/2000/svg">
    ${repeat(
    lines,
    _ => undefined,
    (_, index) => {
      const line: FlowLine = lines[index];
      const isActive: boolean = line.active;
      let cssLine: string = line.cssLine;

      if (!isActive) {
        switch (inactiveFlowsMode) {
          case InactiveFlowsMode.Dimmed:
            cssLine += " " + CssClass.Dimmed;
            break;

          case InactiveFlowsMode.Greyed:
            cssLine = CssClass.Inactive;
            break;
        }
      }

      return svg`
          <path class="${cssLine}" d="${line.path}"></path>
          ${animationEnabled && isActive ?
          svg`
            <circle r="${DOT_RADIUS}" class="${line.cssDot}">
              <animateMotion path="${line.path}" dur="${line.animDuration}s" repeatCount="indefinite" calcMode="linear"></animateMotion>
            </circle>
          `
          : ""}
        `;
    }
  )}
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

      const segmentLengths: number = groupLength - (activeSegments - (segmentGroups.length === 1 ? 0 : 1)) * interSegmentLength;
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
          length = (scale === Scale.Linear ? segment.state : Math.log(segment.state)) / stateTotal * segmentLengths;
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
