import { Flows } from "@/states";
import { EnergyFlowCardExtConfig } from "@/config";

export interface Segment {
  state: number;
  cssClass: string;
}

export interface SegmentGroup {
  segments: Segment[];
  inactiveCss: string;
}

export interface FlowLine {
  cssLine: string;
  cssDot: string;
  path: string;
  active: boolean;
  animDuration: number;
}

export interface AnimSpeeds {
  batteryToGrid: number;
  batteryToHome: number;
  gridToHome: number;
  gridToBattery: number;
  solarToBattery: number;
  solarToGrid: number;
  solarToHome: number;
  lowCarbon: number;
  gas: number;

  // TODO: devices
}
