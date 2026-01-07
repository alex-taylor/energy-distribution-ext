import { EditorPages, EnergyFlowCardExtConfig, GlobalOptions, HomeOptions } from "@/config";
import { GasSourcesMode } from "@/enums";
import { States } from "@/states";
import { DEFAULT_CONFIG, getConfigValue } from "@/config/config";

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

export interface AnimationDurations {
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

export interface PathScaleFactors {
  horizLine: number;
  vertLine: number;
  curvedLine: number;
  topRowLine: number;

  // TODO: devices
}

export function getGasSourcesMode(config: EnergyFlowCardExtConfig, states: States): GasSourcesMode {
  const gasSourcesMode: GasSourcesMode = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Home, GlobalOptions.Options, HomeOptions.Gas_Sources]);
  const gasThreshold: number = getConfigValue([config, DEFAULT_CONFIG], [EditorPages.Home, GlobalOptions.Options, HomeOptions.Gas_Sources_Threshold]);

  return gasSourcesMode === GasSourcesMode.Automatic
    ? 100 * states.homeGas / states.homeElectric + states.homeGas < gasThreshold
      ? GasSourcesMode.Add_To_Total
      : GasSourcesMode.Show_Separately
    : gasSourcesMode;
};
