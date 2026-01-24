import { GlobalOptions, HomeConfig, HomeOptions } from "@/config";
import { CssClass, GasSourcesMode } from "@/enums";
import { States } from "@/nodes";
import { getConfigValue } from "@/config/config";

export interface Segment {
  state: number;
  cssClass: CssClass;
}

export interface SegmentGroup {
  segments: Segment[];
  inactiveCss: CssClass;
}

export interface FlowLine {
  cssLine: CssClass;
  cssDot: CssClass;
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
  devicesToHomeElectric: number[];
  devicesToHomeGas: number[];
  homeToDevicesElectric: number[];
  homeToDevicesGas: number[];
}

export function getGasSourcesMode(configs: HomeConfig[], states: States): GasSourcesMode {
  const gasSourcesMode: GasSourcesMode = getConfigValue(configs, [GlobalOptions.Options, HomeOptions.Gas_Sources]);
  const gasThreshold: number = getConfigValue(configs, [GlobalOptions.Options, HomeOptions.Gas_Sources_Threshold]);

  return gasSourcesMode === GasSourcesMode.Automatic
    ? (100 * states.homeGas / states.homeElectric + states.homeGas) < gasThreshold
      ? GasSourcesMode.Add_To_Total
      : GasSourcesMode.Show_Separately
    : gasSourcesMode;
}
