import { css, CSSResult } from 'lit';
import { CIRCLE_STROKE_WIDTH, CIRCLE_STROKE_WIDTH_SEGMENTS, COL_SPACING_MIN } from '@/const';

export const styles: CSSResult = css`
  :host {
    --mdc-icon-size: calc(2 * var(--ha-font-size-s));
    --label-height: calc(var(--ha-font-size-s) * var(--ha-line-height-normal));
  }
  :root {
  }
  .card-content {
    position: relative;
    direction: ltr;
    max-width: calc(var(--circle-size) * 5 + var(--col-spacing) * 4);
    margin: 0 auto;
  }

  .lines {
    position: absolute;
    width: calc(100% - 2 * var(--ha-space-4));
    height: calc(100% - 2 * var(--ha-space-4));
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
    min-width: calc(${COL_SPACING_MIN}px);
  }

  .node-spacer {
    min-width: var(--circle-size);
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
  .node .circle {
    cursor: var(--clickable-cursor);
  }

  ha-icon.small {
    --mdc-icon-size: var(--ha-font-size-s);
  }
  ha-svg-icon.small {
    --mdc-icon-size: var(--ha-font-size-s);
    padding-bottom: 2px;
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
    opacity: 40%;
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
  .non-fossil.value {
    color: var(--value-non-fossil-color);
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
  .solar.value {
    color: var(--value-solar-color);
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
  .gas.value {
    color: var(--value-gas-color);
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
  .export-grid.value {
    color: var(--value-export-grid-color);
  }
  .import-grid.value {
    color: var(--value-import-grid-color);
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
  .home.value.electric {
    color: var(--value-electric-home-color);
  }
  .home.value.gas {
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
  .export-battery.value {
    color: var(--value-export-battery-color);
  }
  .import-battery.value {
    color: var(--value-import-battery-color);
  }

  path.inactive {
    stroke: var(--inactive-flow-color) !important;
  }
  path.dashed {
    stroke-dasharray: 25px;
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

  circle.inactive {
    stroke: var(--disabled-text-color);
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
    padding-top: 2px;
    padding-bottom: 2px;
  }

  ha-icon.inactive {
    color: var(--disabled-text-color) !important;
  }

  ha-entity-picker {
    flex-grow: 1;
    min-width: 0;
  }

`;
