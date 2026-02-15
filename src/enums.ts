namespace Enums {
  export const AnimationMode = {
    System_Setting: "system_setting",
    Enabled: "enabled",
    Disabled: "disabled"
  } as const satisfies Record<string, string>;

  export const ColourMode = {
    Do_Not_Colour: "none",
    Flow: "flow",
    Automatic: "auto",
    Import: "import",
    Export: "export",
    Dynamic: "dynamic",
    Solar: "solar",
    High_Carbon: "high_carbon",
    Low_Carbon: "low_carbon",
    Battery: "battery",
    Gas: "gas",
    Custom: "custom",
    Default: "default"
  } as const satisfies Record<string, string>;

  export const DateRange = {
    Today: "today",
    Yesterday: "yesterday",
    This_Week: "this_week",
    This_Month: "this_month",
    This_Quarter: "this_quarter",
    This_Year: "this_year",
    Last_7_Days: "now-7d",
    Last_30_Days: "now-30d",
    Last_12_Months: "now-12m",
    Custom: "custom",
    From_Date_Picker: "from_date_picker"
  } as const satisfies Record<string, string>;

  export const DateRangeDisplayMode = {
    Do_Not_Show: "do_not_show",
    Preset_Name: "label",
    Dates: "dates",
    Both: "both"
  } as const satisfies Record<string, string>;

  export const DeviceClasses = {
    Battery: "battery",
    Energy: "energy",
    Gas: "gas",
    Monetary: "monetary",
    Power: "power",
    None: ""
  } as const satisfies Record<string, string>;

  export const DisplayMode = {
    Energy: "energy",
    Power: "power"
  } as const satisfies Record<string, string>;

  export const EnergyDirection = {
    Consumer_Only: "consumer",
    Producer_Only: "producer",
    Both: "both"
  } as const satisfies Record<string, string>;

  export const EnergyType = {
    Electric: "electric",
    Gas: "gas"
  } as const satisfies Record<string, string>;

  export const EnergyUnits = {
    WattHours: "Wh",
    Joules: "J",
    Calories: "cal"
  } as const satisfies Record<string, string>;

  export const GasSourcesMode = {
    Do_Not_Show: "do_not_show",
    Add_To_Total: "add_to_total",
    Show_Separately: "show_separately",
    Automatic: "automatic"
  } as const satisfies Record<string, string>;

  export const InactiveFlowsMode = {
    Normal: "normal",
    Dimmed: "dimmed",
    Greyed: "greyed"
  } as const satisfies Record<string, string>;

  export const LowCarbonDisplayMode = {
    Value: "value",
    Percentage: "percentage",
    Both: "both"
  } as const satisfies Record<string, string>;

  export const PrefixThreshold = {
    Threshold_900: "900",
    Threshold_925: "925",
    Threshold_950: "950",
    Threshold_975: "975",
    Threshold_1000: "1000",
    Threshold_1025: "1025",
    Threshold_1050: "1050",
    Threshold_1075: "1075",
    Threshold_1100: "1100"
  } as const satisfies Record<string, string>;

  export const Scale = {
    Linear: "linear",
    Logarithmic: "logarithmic"
  } as const satisfies Record<string, string>;

  export const StateClasses = {
    Measurement: "measurement",
    Total: "total",
    Total_Increasing: "total_increasing"
  } as const satisfies Record<string, string>;

  export const UnitPosition = {
    After_Space: "after_space",
    Before_Space: "before_space",
    After: "after",
    Before: "before",
    Hidden: "hidden"
  } as const satisfies Record<string, string>;

  export const UnitPrefixes = {
    Unified: "unified",
    Individual: "individual"
  } as const satisfies Record<string, string>;

  export const VolumeUnits = {
    Same_As_Electric: "same_as_electric",
    Cubic_Feet: "ft³",
    Cubic_Metres: "m³",
    CCF: "CCF",
    MCF: "MCF",
    Litres: "L"
  } as const satisfies Record<string, string>;
}

export const AnimationMode = Enums.AnimationMode;
export type AnimationMode = typeof AnimationMode[keyof typeof AnimationMode];
export const ColourMode = Enums.ColourMode;
export type ColourMode = typeof ColourMode[keyof typeof ColourMode];
export const DateRange = Enums.DateRange;
export type DateRange = typeof DateRange[keyof typeof DateRange];
export const DateRangeDisplayMode = Enums.DateRangeDisplayMode;
export type DateRangeDisplayMode = typeof DateRangeDisplayMode[keyof typeof DateRangeDisplayMode];
export const DeviceClasses = Enums.DeviceClasses;
export type DeviceClasses = typeof DeviceClasses[keyof typeof DeviceClasses];
export const DisplayMode = Enums.DisplayMode;
export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode];
export const EnergyDirection = Enums.EnergyDirection;
export type EnergyDirection = typeof EnergyDirection[keyof typeof EnergyDirection];
export const EnergyType = Enums.EnergyType;
export type EnergyType = typeof EnergyType[keyof typeof EnergyType];
export const EnergyUnits = Enums.EnergyUnits;
export type EnergyUnits = typeof EnergyUnits[keyof typeof EnergyUnits];
export const GasSourcesMode = Enums.GasSourcesMode;
export type GasSourcesMode = typeof GasSourcesMode[keyof typeof GasSourcesMode];
export const InactiveFlowsMode = Enums.InactiveFlowsMode;
export type InactiveFlowsMode = typeof InactiveFlowsMode[keyof typeof InactiveFlowsMode];
export const LowCarbonDisplayMode = Enums.LowCarbonDisplayMode;
export type LowCarbonDisplayMode = typeof LowCarbonDisplayMode[keyof typeof LowCarbonDisplayMode];
export const PrefixThreshold = Enums.PrefixThreshold;
export type PrefixThreshold = typeof PrefixThreshold[keyof typeof PrefixThreshold];
export const Scale = Enums.Scale;
export type Scale = typeof Scale[keyof typeof Scale];
export const StateClasses = Enums.StateClasses;
export type StateClasses = typeof StateClasses[keyof typeof StateClasses];
export const UnitPosition = Enums.UnitPosition;
export type UnitPosition = typeof UnitPosition[keyof typeof UnitPosition];
export const UnitPrefixes = Enums.UnitPrefixes;
export type UnitPrefixes = typeof UnitPrefixes[keyof typeof UnitPrefixes];
export const VolumeUnits = Enums.VolumeUnits;
export type VolumeUnits = typeof VolumeUnits[keyof typeof VolumeUnits];

(() => {
  Object.keys(Enums).forEach(e => {
    const type = Enums[e];

    Object.defineProperty(type, "name", {
      value: e,
      configurable: true
    });
  });
})();

//================================================================================================================================================================================//

export enum CssClass {
  None = "",
  Battery = "battery",
  Battery_Export = "export-battery",
  Battery_Import = "import-battery",
  Device = "device",
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
  Hidden_Circle = "hidden-circle",
  Hidden_Path = "hidden-path",
  Grid_Battery_Anim = "grid-battery-anim",
  Grid_To_Home_Anim = "grid-to-home-anim",
  Top_Row = "top-row",
  Bottom_Row = "bottom-row"
}

export enum SIUnitPrefixes {
  None = "",
  Kilo = "k",
  Mega = "M",
  Giga = "G",
  Tera = "T"
}

export enum DevicesLayout {
  None,
  Inline_Above,
  Inline_Below,
  Horizontal,
  Vertical
}

//================================================================================================================================================================================//

export function checkEnumValue(value: object, type: object): boolean {
  return Object.values(type).includes(value);
}

//================================================================================================================================================================================//

export const ELECTRIC_ENTITY_CLASSES: DeviceClasses[] = [DeviceClasses.Energy];
export const GAS_ENTITY_CLASSES: DeviceClasses[] = [DeviceClasses.Energy, DeviceClasses.Gas];

//================================================================================================================================================================================//
