import { html, TemplateResult, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { Segment, SegmentGroup } from ".";
import { CIRCLE_CENTRE } from "@/const";
import { CssClass } from "@/enums";

const INTER_GROUP_ARC: number = 7.5;
const INTER_SEGMENT_ARC: number = INTER_GROUP_ARC / 2;

//================================================================================================================================================================================//

export const renderLine = (id: string, path: string): TemplateResult => {
  return svg`<path id="${id}" class="${id}" d="${path}" vector-effect="non-scaling-stroke"/>`;
};

//================================================================================================================================================================================//

export const renderDot = (size: number, cssClass: string, duration: number, reverseDirection: boolean = false, pathRef: string | undefined = undefined): TemplateResult => {
  return svg`
      <circle r="${size}" class="${cssClass}" vector-effect="non-scaling-stroke">
        <animateMotion dur="${duration}s" repeatCount="indefinite" keyPoints="${reverseDirection ? "1; 0" : "0; 1"}" keyTimes="0; 1" calcMode="linear">
          <mpath xlink: href = "#${pathRef ?? cssClass}"/>
        </animateMotion>
      </circle>
      `;
};

//================================================================================================================================================================================//

export function renderSegmentedCircle(segmentGroups: SegmentGroup[], radius: number, startingAngle: number, interSegmentGaps: boolean): TemplateResult {
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
        stateTotal += segment.state;

        if (segment.state > 0) {
          activeSegments++;
        }
      });

      if (activeSegments === 0) {
        return svg`
          <circle
            class="${CssClass.Unknown}"
            cx = "${CIRCLE_CENTRE}"
            cy = "${CIRCLE_CENTRE}"
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
          length = segment.state / stateTotal * segmentLengths;
          offset += interSegmentGap + length;

          return svg`
          <circle
            class="${segment.cssClass}"
            cx = "${CIRCLE_CENTRE}"
            cy = "${CIRCLE_CENTRE}"
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
