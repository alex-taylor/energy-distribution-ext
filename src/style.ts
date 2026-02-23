// noinspection CssUnresolvedCustomProperty,CssUnusedSymbol

import { css, CSSResult } from 'lit';
import { CIRCLE_STROKE_WIDTH, CIRCLE_STROKE_WIDTH_SEGMENTS, ICON_PADDING } from '@/const';

//================================================================================================================================================================================//

// noinspection CssReplaceWithShorthandSafely
export const styles: CSSResult = css`
  :host {
    --mdc-icon-size: calc(2 * var(--ha-font-size-s));
    --label-height: calc(var(--ha-font-size-s) * var(--ha-line-height-normal));
  }

  .card-content {
    position: relative;
    direction: ltr;
    max-width: calc(var(--circle-size) + (var(--col-spacing-max) + var(--circle-size)) * var(--num-columns));
    margin: 0 auto;
  }

  .lines {
    position: absolute;
    width: calc(100% - 2 * var(--ha-space-4));
    height: calc(100% - 2 * var(--ha-space-4));
  }

  .overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 60%;
    z-index: 10;
    background-color: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    align-content: center;
    text-align: center;
    font-size: var(--ha-heading-card-title-font-size, var(--ha-font-size-l));
    font-weight: var(--ha-heading-card-title-font-weight, var(--ha-font-weight-normal));
    line-height: var(--ha-heading-card-title-line-height, var(--ha-line-height-normal));
  }

  .overlay-message {
    padding: 0 25px;
    display: block;
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
  }

  .top-row {
    height: calc(var(--label-height) + var(--circle-size) + var(--row-spacing));
  }

  .bottom-row {
    height: calc(var(--circle-size) + var(--row-spacing));
    justify-content: flex-end;
  }

  .horiz-spacer {
    min-width: var(--col-spacing-min);
  }

  .node-spacer {
    min-width: var(--circle-size);
  }

  .power-outage {
    color: var(--error-color);
  }

  .node {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
  }

  .circle {
    width: var(--circle-size);
    height: var(--circle-size);
    border-radius: 50%;
    box-sizing: border-box;
    border: calc(${CIRCLE_STROKE_WIDTH}px);
    border-style: solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: var(--ha-font-size-s);
    line-height: var(--ha-font-size-s);
    position: relative;
    text-decoration: none;
    color: var(--primary-text-color);
  }

  .background {
    border-width: 0;
    background-color: var(--card-background-color);
  }

  .hidden-circle {
    border-width: 0;
  }

  .circle .inactive {
    border-color: var(--disabled-text-color) !important;
  }

  span.secondary-info,
  .value:not(.home) {
    cursor: var(--clickable-cursor);
  }

  ha-icon.small {
    --mdc-icon-size: var(--ha-font-size-s);
  }

  ha-svg-icon.small {
    --mdc-icon-size: var(--ha-font-size-s);
    padding-bottom: calc(${ICON_PADDING}px);
  }

  ha-svg-icon.hidden {
    --mdc-icon-size: 0px !important;
  }

  .label {
    color: var(--secondary-text-color);
    font-size: var(--ha-font-size-s);
    max-width: var(--circle-size);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  path {
    stroke-width: 1;
    fill: none;
    vector-effect: non-scaling-stroke;
  }

  .circle svg {
    position: absolute;
    fill: none;
    stroke-width: calc(${CIRCLE_STROKE_WIDTH_SEGMENTS}px);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .dimmed {
    opacity: 25%;
  }

  span {
    z-index: 2;
  }

  span.secondary-info {
    font-size: var(--ha-font-size-s);
  }

  span.inactive {
    color: var(--disabled-text-color) !important;
  }

  .non-fossil .circle {
    border-color: var(--circle-non-fossil-color);
  }

  .non-fossil ha-icon {
    color: var(--icon-non-fossil-color);
  }

  .non-fossil.secondary-info {
    color: var(--secondary-non-fossil-color);
  }

  .non-fossil.value:not(.idle) {
    color: var(--importValue-non-fossil-color);
    padding-bottom: calc(${ICON_PADDING}px);
  }

  .solar .circle {
    border-color: var(--circle-solar-color);
  }

  .solar ha-icon {
    color: var(--icon-solar-color);
  }

  .solar.secondary-info {
    color: var(--secondary-solar-color);
  }

  .solar.value:not(.idle) {
    color: var(--importValue-solar-color);
  }

  .gas .circle {
    border-color: var(--circle-gas-color);
  }

  .gas ha-icon {
    color: var(--icon-gas-color);
  }

  .gas.secondary-info {
    color: var(--secondary-gas-color);
  }

  .gas.value:not(.idle) {
    color: var(--importValue-gas-color);
  }

  .grid .circle {
    border-color: var(--circle-grid-color);
  }

  .grid ha-icon {
    color: var(--icon-grid-color);
  }

  .grid.secondary-info {
    color: var(--secondary-grid-color);
  }

  .export-grid.value:not(.idle) {
    color: var(--exportValue-grid-color);
  }

  .import-grid.value:not(.idle) {
    color: var(--importValue-grid-color);
  }

  .home .circle {
    border-color: var(--circle-home-color);
    cursor: default !important;
  }

  .home ha-icon {
    color: var(--icon-home-color);
  }

  .home.secondary-info {
    color: var(--secondary-home-color);
  }

  .home.value.electric:not(.idle) {
    color: var(--value-electric-home-color);
  }

  .home.value.gas:not(.idle) {
    color: var(--value-gas-home-color);
  }

  .battery .circle {
    border-color: var(--circle-battery-color);
  }

  .battery ha-icon {
    color: var(--icon-battery-color);
  }

  .battery.secondary-info {
    color: var(--secondary-battery-color);
  }

  .export-battery.value:not(.idle) {
    color: var(--exportValue-battery-color);
  }

  .import-battery.value:not(.idle) {
    color: var(--importValue-battery-color);
  }

  .device .circle {
    border-color: red;
  }

  path.inactive {
    stroke: var(--inactive-flow-color) !important;
  }

  path.solar {
    stroke: var(--flow-solar-color);
  }

  path.export-grid {
    stroke: var(--flow-export-grid-color);
  }

  path.import-grid {
    stroke: var(--flow-import-grid-color);
  }

  path.export-battery {
    stroke: var(--flow-export-battery-color);
  }

  path.import-battery {
    stroke: var(--flow-import-battery-color);
  }

  path.gas {
    stroke: var(--flow-gas-color);
  }

  path.non-fossil {
    stroke: var(--flow-non-fossil-color);
  }

  path.hidden {
    opacity: 0;
  }

  circle.inactive {
    stroke: var(--disabled-text-color) !important;
  }

  circle.non-fossil {
    fill: var(--flow-non-fossil-color);
    stroke: var(--flow-non-fossil-color);
  }

  circle.solar {
    fill: var(--flow-solar-color);
    stroke: var(--flow-solar-color);
  }

  circle.gas {
    fill: var(--flow-gas-color);
    stroke: var(--flow-gas-color);
  }

  circle.export-grid {
    fill: var(--flow-export-grid-color);
    stroke: var(--flow-export-grid-color);
  }

  circle.import-grid {
    fill: var(--flow-import-grid-color);
    stroke: var(--flow-import-grid-color);
  }

  circle.export-battery {
    fill: var(--flow-export-battery-color);
    stroke: var(--flow-export-battery-color);
  }

  circle.import-battery {
    fill: var(--flow-import-battery-color);
    stroke: var(--flow-import-battery-color);
  }

  .circle svg circle {
    animation: rotate-in 0.6s ease-in;
    transition: stroke-dashoffset 0.4s, stroke-dasharray 0.4s;
    fill: none;
  }

  .card-actions a {
    text-decoration: none;
  }

  .entity-icon {
    padding-top: calc(${ICON_PADDING}px);
    padding-bottom: calc(${ICON_PADDING}px);
  }

  ha-icon.inactive {
    color: var(--disabled-text-color) !important;
  }

  .grid-to-home-anim {
    animation-duration: var(--grid-to-home-anim-duration);
    animation-name: gridToHomeAnim;
    animation-iteration-count: infinite;
  }

  @keyframes gridToHomeAnim {
    0% {
      stroke: var(--flow-import-grid-color);
      fill: var(--flow-import-grid-color);
    }
    50% {
      stroke: var(--flow-non-fossil-color);
      fill: var(--flow-non-fossil-color);
    }
    100% {
      stroke: var(--flow-import-grid-color);
      fill: var(--flow-import-grid-color);
    }
  }

  .grid-battery-anim {
    animation-duration: var(--grid-battery-anim-duration);
    animation-name: gridBatteryAnim;
    animation-iteration-count: infinite;
  }

  @keyframes gridBatteryAnim {
    0% {
      stroke: var(--flow-export-grid-color);
    }
    50% {
      stroke: var(--flow-export-battery-color);
    }
    100% {
      stroke: var(--flow-export-grid-color);
    }
  }

  .separator {
    margin-bottom: 24px;
    width: 100%;
  }

  .date-label {
    cursor: default;
    font-size: var(--ha-font-size-l);
  }

`;

//================================================================================================================================================================================//
