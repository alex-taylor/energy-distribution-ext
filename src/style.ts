import { css } from 'lit';

export const styles = css`
  :host {
    --mdc-icon-size: 24px;
    --clickable-cursor: pointer;

    --icon-home-color: var(--energy-grid-consumption-color, #488fc2);
    --text-home-color: var(--primary-text-color);
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
  .circle-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
  }
  .spacer {
    width: 84px;
  }
  .circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 2px solid;
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
    stroke-width: 4px;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: -1;
  }

  span.secondary-info {
    color: var(--primary-text-color);
    font-size: 12px;
    max-width: 60px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  .circle-container.non-fossil {
    margin-right: 4px;
    height: 130px;
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
  circle.non-fossil,
  path.non-fossil {
    stroke: var(--circle-non-fossil-color);
  }
  circle.non-fossil {
    stroke-width: 4;
    fill: var(--circle-non-fossil-color);
  }

  .circle-container.solar {
    margin: 0 4px;
    height: 130px;
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
  circle.solar,
  path.solar {
    stroke: var(--circle-solar-color);
  }
  circle.solar {
    stroke-width: 4;
    fill: var(--circle-solar-color);
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
  circle.gas,
  path.gas {
    stroke: var(--circle-gas-color);
  }
  circle.gas {
    stroke-width: 4;
    fill: var(--circle-gas-color);
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
  circle.return,
  circle.battery-to-grid,
  path.return {
    stroke: var(--energy-grid-return-color);
  }
  circle.grid,
  circle.battery-from-grid,
  path.grid {
    stroke: var(--energy-grid-consumption-color);
  }
  circle.return,
  circle.battery-to-grid {
    stroke-width: 4;
    fill: var(--energy-grid-return-color);
  }
  circle.grid,
  circle.battery-from-grid {
    stroke-width: 4;
    fill: var(--energy-grid-consumption-color);
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
  circle.battery,
  path.battery,
  circle.battery-home,
  path.battery-home {
    stroke: var(--energy-battery-out-color);
  }
  circle.battery-solar,
  path.battery-solar {
    stroke: var(--energy-battery-in-color);
  }
  circle.battery-home {
    stroke-width: 4;
    fill: var(--energy-battery-out-color);
  }
  circle.battery-solar {
    stroke-width: 4;
    fill: var(--energy-battery-in-color);
  }
  path.battery-from-grid {
    stroke: var(--energy-grid-consumption-color);
  }
  path.battery-to-grid {
    stroke: var(--energy-grid-return-color);
  }

  circle.home-unknown {
    stroke: var(--primary-text-color);
  }
  .home .circle {
    border-width: 0;
    border-color: var(--primary-color);
  }
  .home .circle.border {
    border-width: 2px;
  }
  .home ha-icon:not(.small) {
    color: var(--icon-home-color);
  }

  .circle svg circle {
    animation: rotate-in 0.6s ease-in;
    transition: stroke-dashoffset 0.4s, stroke-dasharray 0.4s;
    fill: none;
  }

  #home-circle {
    color: var(--text-home-color);
  }

  @keyframes rotate-in {
    from {
      stroke-dashoffset: 238.76104;
      stroke-dasharray: 238.76104;
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
