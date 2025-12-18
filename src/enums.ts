import { localize } from '@/localize/localize';

export enum EnergyUnits {
  MegaWattHours = "MWh",
  KiloWattHours = "kWh",
  WattHours = "Wh"
}

export enum CssClass {
  Battery = "battery",
  BatteryExport = "battery-export",
  BatteryImport = "battery-import",
  Gas = "gas",
  Grid = "grid",
  GridExport = "grid-export",
  GridImport = "grid-import",
  // for some reason HASS calls its css classes 'non-fossil'
  LowCarbon = "non-fossil",
  Solar = "solar",
  Inactive = "inactive",
  Dimmed = "dimmed",
  HiddenCircle = "hidden-circle"
}

export enum DefaultValues {
  // EnergyUnits
  KilowattHourDecimals = 2,
  MegawattHourDecimals = 1,
  WhkWhThreshold = 1000,
  KwhMwhThreshold = 1000,

  // Flows
  MinRate = 1,
  MaxRate = 6,
  MinEnergy = 10,
  MaxEnergy = 2000
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
  Default = "default",
  Circle = "circle",
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
  Custom = "custom"
}

export namespace ColourMode {
  export function getName(value: ColourMode): string {
    return getEditorLabel("ColourMode", value);
  }

  export function getItem(value: ColourMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum LowCarbonType {
  Energy = "energy",
  Percentage = "percentage"
}

export namespace LowCarbonType {
  export function getName(value: LowCarbonType): string {
    return getEditorLabel("LowCarbonType", value);
  }

  export function getItem(value: LowCarbonType): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum DeviceType {
  Consumption_Electric = "consumption_electric",
  Production_Electric = "production_electric",
  Consumption_Gas = "consumption_gas",
  Production_Gas = "production_gas"
}

export namespace DeviceType {
  export function getName(value: DeviceType): string {
    return getEditorLabel("DeviceType", value);
  }

  export function getItem(value: DeviceType): { label: string, value: string } {
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
    return getEditorLabel("InactiveLinesMode", value);
  }

  export function getItem(value: InactiveFlowsMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

export enum DotsMode {
  Off = "off",
  HASS = "hass",
  Dynamic = "dynamic"
}

export namespace DotsMode {
  export function getName(value: DotsMode): string {
    return getEditorLabel("DotsMode", value);
  }

  export function getItem(value: DotsMode): { label: string, value: string } {
    return { label: getName(value), value: value };
  }
}

function getEditorLabel(type: string, value: any): string {
  return localize(type + "." + value);
}

export enum UnitPrefixes {
  HASS = "hass",
  Automatic = "automatic"
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
  Hidden = "hidden",
  Before = "before",
  After = "after",
  Before_Space = "before_space",
  After_Space = "after_space"
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
