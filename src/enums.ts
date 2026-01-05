import { localize } from '@/localize/localize';

function getEditorLabel(type: string, value: any): string {
  return localize(type + "." + value);
}

export function checkEnumValue(value: any, type: any): boolean {
  return Object.values(type).includes(value);
}

export enum EnergyUnitPrefix {
  None = "",
  Kilo = "k",
  Mega = "M",
  Giga = "G",
  Tera = "T"
}

export enum CssClass {
  Battery = "battery",
  Battery_Export = "export-battery",
  Battery_Import = "import-battery",
  Electric = "electric",
  Gas = "gas",
  Grid = "grid",
  Grid_Export = "export-grid",
  Grid_Import = "import-grid",
  Home = "home",
  // for some reason HASS calls its css classes 'non-fossil'
  Low_Carbon = "non-fossil",
  Solar = "solar",
  Inactive = "inactive",
  Dimmed = "dimmed",
  Hidden_Circle = "hidden-circle"
}

export enum DisplayMode {
  Today = "today",
  History = "history",
  Hybrid = "hybrid"
}

export namespace DisplayMode {
  export function getName(value: DisplayMode): string {
    return getEditorLabel("DisplayMode", value);
  }

  export function getItem(value: DisplayMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum ColourMode {
  Do_Not_Colour = "none",
  Flow = "flow",
  Larger_Value = "larger_value",
  Largest_Value = "largest_value",
  Import = "import",
  Export = "export",
  Dynamic = "dynamic",
  Solar = "solar",
  High_Carbon = "high_carbon",
  Low_Carbon = "low_carbon",
  Battery = "battery",
  Gas = "gas",
  Custom = "custom",
  Default = "default"
}

export namespace ColourMode {
  export function getName(value: ColourMode): string {
    return getEditorLabel("ColourMode", value);
  }

  export function getItem(value: ColourMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum LowCarbonDisplayMode {
  Energy = "energy",
  Percentage = "percentage",
  Both = "both"
}

export namespace LowCarbonDisplayMode {
  export function getName(value: LowCarbonDisplayMode): string {
    return getEditorLabel("LowCarbonDisplayMode", value);
  }

  export function getItem(value: LowCarbonDisplayMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum InactiveFlowsMode {
  Normal = "normal",
  Dimmed = "dimmed",
  Greyed = "greyed"
}

export namespace InactiveFlowsMode {
  export function getName(value: InactiveFlowsMode): string {
    return getEditorLabel("InactiveFlowsMode", value);
  }

  export function getItem(value: InactiveFlowsMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum UnitPrefixes {
  Unified = "unified",
  Individual = "individual"
}

export namespace UnitPrefixes {
  export function getName(value: UnitPrefixes): string {
    return getEditorLabel("UnitPrefixes", value);
  }

  export function getItem(value: UnitPrefixes): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum UnitPosition {
  After_Space = "after_space",
  Before_Space = "before_space",
  After = "after",
  Before = "before",
  Hidden = "hidden"
}

export namespace UnitPosition {
  export function getName(value: UnitPosition): string {
    return getEditorLabel("UnitPosition", value);
  }

  export function getItem(value: UnitPosition): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum EntityMode {
  Totalising = "totalising",
  Resetting = "resetting",
  Misconfigured_Resetting = "misconfigured resetting"
}

export enum GasSourcesMode {
  Do_Not_Show = "do_not_show",
  Add_To_Total = "add_to_total",
  Show_Separately = "show_separately",
  Automatic = "automatic"
}

export namespace GasSourcesMode {
  export function getName(value: GasSourcesMode): string {
    return getEditorLabel("GasSourcesMode", value);
  }

  export function getItem(value: GasSourcesMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum EnergyType {
  Electric = "electric",
  Gas = "gas"
}

export namespace EnergyType {
  export function getName(value: EnergyType): string {
    return getEditorLabel("EnergyType", value);
  }

  export function getItem(value: EnergyType): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum EnergyDirection {
  Source = "source",
  Consumer = "consumer",
  Both = "both"
}

export namespace EnergyDirection {
  export function getName(value: EnergyDirection): string {
    return getEditorLabel("EnergyDirection", value);
  }

  export function getItem(value: EnergyDirection): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum Scale {
  Linear = "linear",
  Logarithmic = "logarithmic"
}

export namespace Scale {
  export function getName(value: Scale): string {
    return getEditorLabel("Scale", value);
  }

  export function getItem(value: Scale): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum EnergyUnits {
  WattHours = "Wh",
  Joules = "J",
  Calories = "cal"
}

export namespace EnergyUnits {
  export function getName(value: EnergyUnits): string {
    return getEditorLabel("EnergyUnits", value);
  }

  export function getItem(value: EnergyUnits): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum VolumeUnits {
  Same_As_Electric = "same_as_electric",
  Cubic_Feet = "ft³",
  Cubic_Metres = "m³",
  CCF = "CCF",
  MCF = "MCF",
  Litres = "L"
}

export namespace VolumeUnits {
  export function getName(value: VolumeUnits): string {
    return getEditorLabel("VolumeUnits", value);
  }

  export function getItem(value: VolumeUnits): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum PrefixThreshold {
  Threshold_900 = 900,
  Threshold_925 = 925,
  Threshold_950 = 950,
  Threshold_975 = 975,
  Threshold_1000 = 1000,
  Threshold_1025 = 1025,
  Threshold_1050 = 1050,
  Threshold_1075 = 1075,
  Threshold_1100 = 1100
}
