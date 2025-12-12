import { css } from 'lit';
import { CIRCLE_CIRCUMFERENCE, CIRCLE_STROKE_WIDTH, CIRCLE_STROKE_WIDTH_SEGMENTS } from './const';

export const styles = css`
  :host {
    --mdc-icon-size: 24px;
    --clickable-cursor: pointer;

    --lines-svg-not-flat-line-height: 106%;
    --lines-svg-not-flat-line-top: -3%;
    --lines-svg-flat-width: calc(100% - 160px);
    --lines-svg-not-flat-width: calc(103% - 165px);
  }
  :root {
  }
  .card-content {
    position: relative;
    margin: 0 auto;
  }

  .card-content,
  .row {
    max-width: 470px;
  }

  .lines {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 146px;
    display: flex;
    justify-content: center;
    padding: 0 16px 16px;
    box-sizing: border-box;
  }
  .lines.high {
    bottom: 100px;
    height: 156px;
  }
  .lines svg {
    width: var(--lines-svg-flat-width);
    height: 100%;
    max-width: 340px;
  }
  .lines svg:not(.flat-line) {
    width: var(--lines-svg-not-flat-width);
    height: var(--lines-svg-not-flat-line-height);
    top: var(--lines-svg-not-flat-line-top);
    position: relative;
  }

  .row {
    display: flex;
    justify-content: space-between;
    max-width: 500px;
    margin: 0 auto;
  }
  .top-row {
    height: 130px;
  }

  .circle-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
  }
  .circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    box-sizing: border-box;
    border: ${CIRCLE_STROKE_WIDTH};
    border-style: solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 12px;
    line-height: 12px;
    position: relative;
    text-decoration: none;
    color: var(--primary-text-color);
  }
  .hidden-circle {
    border-width: 0;
  }
  .circle-container .circle {
    cursor: var(--clickable-cursor);
  }
  ha-icon {
    padding-bottom: 2px;
  }
  ha-icon.small {
    --mdc-icon-size: 12px;
  }
  .label {
    color: var(--secondary-text-color);
    font-size: 12px;
    max-width: 80px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  line,
  path {
    stroke: var(--disabled-text-color);
    stroke-width: 1;
    fill: none;
  }
  .circle svg {
    position: absolute;
    fill: none;
    stroke-width: ${CIRCLE_STROKE_WIDTH_SEGMENTS};
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: -1;
  }

  span.secondary-info {
    font-size: 12px;
    max-width: 60px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  .non-fossil .circle {
    border-color: var(--circle-non-fossil-color);
  }
  .non-fossil span:not(.label) {
    color: var(--text-non-fossil-color);
  }
  .non-fossil ha-icon {
    color: var(--icon-non-fossil-color);
  }

  .solar .circle {
    border-color: var(--circle-solar-color);
  }
  .solar span:not(.label) {
    color: var(--text-solar-color);
  }
  .solar ha-icon {
    color: var(--icon-solar-color);
  }

  .gas .circle {
    border-color: var(--circle-gas-color);
  }
  .gas span:not(.label) {
    color: var(--text-gas-color);
  }
  .gas ha-icon {
    color: var(--icon-gas-color);
  }

  .grid .circle {
    border-color: var(--circle-grid-color);
  }
  .grid-export {
    color: var(--text-grid-export-color);
    padding-top: 2px;
  }
  .grid-import {
    color: var(--text-grid-import-color);
    padding-top: 2px;
  }
  .grid ha-icon {
    color: var(--icon-grid-color);
  }
  .grid .arrow-import {
    color: var(--text-grid-import-color);
  }
  .grid .arrow-export {
    color: var(--text-grid-export-color);
  }

  .home .circle {
    border-width: 0;
    border-color: var(--primary-color);
  }
  .home .solar {
    stroke: var(--circle-home-solar-color);
  }
  .home .battery {
    stroke: var(--circle-home-battery-color);
  }
  .home .non-fossil {
    stroke: var(--circle-home-non-fossil-color);
  }
  .home .grid {
    stroke: var(--circle-home-grid-color);
  }
  .home ha-icon {
    color: var(--icon-home-color);
  }
  .home span:not(.label) {
    color: var(--text-home-color);
  }

  .circle-container.battery {
    height: 110px;
    justify-content: flex-end;
  }
  .battery .circle {
    border-color: var(--circle-battery-color);
  }
  .battery-export {
    color: var(--text-battery-export-color);
    padding-top: 2px;
  }
  .battery-import {
    color: var(--text-battery-import-color);
    padding-top: 2px;
  }
  .battery ha-icon {
    color: var(--icon-battery-color);
  }
  .battery .arrow-import {
    color: var(--text-battery-import-color);
  }
  .battery .arrow-export {
    color: var(--text-battery-export-color);
  }

  path.unknown {
    stroke: var(--secondary-text-color);
  }
  path.solar {
    stroke: var(--circle-solar-color);
  }
  path.grid-export {
    stroke: var(--text-grid-export-color);
  }
  path.grid-import {
    stroke: var(--text-grid-import-color);
  }
  path.battery-export {
    stroke: var(--text-battery-export-color);
  }
  path.battery-import {
    stroke: var(--text-battery-import-color);
  }

  circle.unknown {
    stroke: var(--secondary-text-color);
  }
  circle.non-fossil {
    fill: var(--circle-non-fossil-color);
    stroke: var(--circle-non-fossil-color);
  }
  circle.solar {
    fill: var(--circle-solar-color);
    stroke: var(--circle-solar-color);
  }
  circle.gas {
    fill: var(--circle-gas-color);
    stroke: var(--circle-gas-color);
  }
  circle.grid-export {
    fill: var(--text-grid-export-color);
    stroke: var(--text-grid-export-color);
  }
  circle.grid-import {
    fill: var(--text-grid-import-color);
    stroke: var(--text-grid-import-color);
  }
  circle.battery-export {
    fill: var(--text-battery-export-color);
    stroke: var(--text-battery-export-color);
  }
  circle.battery-import {
    fill: var(--text-battery-import-color);
    stroke: var(--text-battery-import-color);
  }

  .circle svg circle {
    animation: rotate-in 0.6s ease-in;
    transition: stroke-dashoffset 0.4s, stroke-dasharray 0.4s;
    fill: none;
  }

  @keyframes rotate-in {
    from {
      stroke-dashoffset: ${CIRCLE_CIRCUMFERENCE};
      stroke-dasharray: ${CIRCLE_CIRCUMFERENCE};
    }
  }

  .card-actions a {
    text-decoration: none;
  }

  .home-circle-sections {
    pointer-events: none;
  }

  .entity-icon {
    padding-top: 2px;
    padding-bottom: 2px;
  }

  ha-entity-picker {
    flex-grow: 1;
    min-width: 0;
  }

`;
