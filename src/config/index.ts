import { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';
import { ColourMode, LowCarbonDisplayMode, InactiveFlowsMode, UnitPosition, UnitPrefixes, EnergyDirection, EnergyType, GasSourcesMode, Scale, EnergyUnits, VolumeUnits, DateRange, DateRangeDisplayMode, PrefixThreshold, DeviceClasses } from '@/enums';

declare global {
  interface HTMLElementTagNameMap {
    "hui-error-card": LovelaceCard;
  }
}

//================================================================================================================================================================================//
// These act both as keys in the YAML config, and as the names of the fields in the below Config interfaces                                                                       //
//================================================================================================================================================================================//

namespace ConfigKeys {
  export const AppearanceOptions = {
    Clickable_Entities: "clickable_entities",
    Dashboard_Link: "dashboard_link",
    Dashboard_Link_Label: "dashboard_link_label",
    Energy_Units: "energy_units",
    Flows: "flows",
    Segment_Gaps: "segment_gaps",
    Show_Zero_States: "show_zero_states",
    Use_HASS_Style: "use_hass_style"
  } as const satisfies Record<string, string>;

  export const ColourOptions = {
    Circle: "circle_mode",
    Circle_Colour: "circle_colour",
    Flow_Export: "flow_export_mode",
    Flow_Export_Colour: "flow_export_colour",
    Flow_Import: "flow_import_mode",
    Flow_Import_Colour: "flow_import_colour",
    Icon: "icon_mode",
    Icon_Colour: "icon_colour",
    Secondary: "secondary_mode",
    Secondary_Colour: "secondary_colour",
    Value_Export: "value_export_mode",
    Value_Export_Colour: "value_export_colour",
    Value_Import: "value_import_mode",
    Value_Import_Colour: "value_import_colour"
  } as const satisfies Record<string, string>;

  export const DeviceOptions = {
    Energy_Direction: "energy_direction",
    Energy_Type: "energy_type",
    Icon: "icon",
    Name: "name"
  } as const satisfies Record<string, string>;

  export const EditorPages = {
    Appearance: "appearance",
    Battery: "battery",
    Devices: "devices",
    Gas: "gas",
    Grid: "grid",
    Home: "home",
    Low_Carbon: "low_carbon_energy",
    Solar: "solar"
  } as const satisfies Record<string, string>;

  export const EnergyUnitsOptions = {
    Electric_Units: "electric_units",
    Electric_Unit_Prefixes: "electric_unit_prefixes",
    Display_Precision_Default: "display_precision_default",
    Display_Precision_Under_10: "display_precision_under_10",
    Display_Precision_Under_100: "display_precision_under_100",
    Gas_Calorific_Value: "gas_calorific_value",
    Gas_Units: "gas_units",
    Gas_Unit_Prefixes: "gas_unit_prefixes",
    Prefix_Threshold: "prefix_threshold",
    Unit_Position: "unit_position"
  } as const satisfies Record<string, string>;

  export const EntitiesOptions = {
    Entity_Ids: "entity_ids"
  } as const satisfies Record<string, string>;

  export const FlowsOptions = {
    Animation: "animation",
    Inactive_Flows: "inactive_flows",
    Scale: "scale",
    Use_Hourly_Stats: "use_hourly_stats"
  } as const satisfies Record<string, string>;

  export const GlobalOptions = {
    Date_Range: "date_range",
    Date_Range_From: "date_range_from",
    Date_Range_To: "date_range_to",
    Date_Range_Live: "date_range_live",
    Date_Range_Display: "date_range_display",
    Options: "options",
    Title: "title",
    Use_HASS_Config: "use_hass_config"
  } as const satisfies Record<string, string>;

  export const GridOptions = {
    Power_Outage: "power_outage"
  } as const satisfies Record<string, string>;

  export const HomeOptions = {
    Gas_Sources: "gas_sources",
    Gas_Sources_Threshold: "gas_sources_threshold",
    Subtract_Consumers: "subtract_consumers"
  } as const satisfies Record<string, string>;

  export const LowCarbonOptions = {
    Low_Carbon_Mode: "low_carbon_mode"
  } as const satisfies Record<string, string>;

  export const NodeOptions = {
    Colours: "colours",
    Export_Entities: "export_entities",
    Import_Entities: "import_entities",
    Overrides: "overrides",
    Secondary_Info: "secondary_info"
  } as const satisfies Record<string, string>;

  export const OverridesOptions = {
    Icon: "icon",
    Name: "name"
  } as const satisfies Record<string, string>;

  export const PowerOutageOptions = {
    Entity_Id: "entity_id",
    Alert_Icon: "alert_icon",
    Alert_State: "alert_state"
  } as const satisfies Record<string, string>;

  export const SecondaryInfoOptions = {
    Display_Precision: "display_precision",
    Entity_Id: "entity_id",
    Icon: "icon",
    Unit_Position: "unit_position"
  } as const satisfies Record<string, string>;
}

export const AppearanceOptions = ConfigKeys.AppearanceOptions;
export type AppearanceOptions = typeof AppearanceOptions[keyof typeof AppearanceOptions];
export const ColourOptions = ConfigKeys.ColourOptions;
export type ColourOptions = typeof ColourOptions[keyof typeof ColourOptions];
export const DeviceOptions = ConfigKeys.DeviceOptions;
export type DeviceOptions = typeof DeviceOptions[keyof typeof DeviceOptions];
export const EditorPages = ConfigKeys.EditorPages;
export type EditorPages = typeof EditorPages[keyof typeof EditorPages];
export const EnergyUnitsOptions = ConfigKeys.EnergyUnitsOptions;
export type EnergyUnitsOptions = typeof EnergyUnitsOptions[keyof typeof EnergyUnitsOptions];
export const EntitiesOptions = ConfigKeys.EntitiesOptions;
export type EntitiesOptions = typeof EntitiesOptions[keyof typeof EntitiesOptions];
export const FlowsOptions = ConfigKeys.FlowsOptions;
export type FlowsOptions = typeof FlowsOptions[keyof typeof FlowsOptions];
export const GlobalOptions = ConfigKeys.GlobalOptions;
export type GlobalOptions = typeof GlobalOptions[keyof typeof GlobalOptions];
export const GridOptions = ConfigKeys.GridOptions;
export type GridOptions = typeof GridOptions[keyof typeof GridOptions];
export const HomeOptions = ConfigKeys.HomeOptions;
export type HomeOptions = typeof HomeOptions[keyof typeof HomeOptions];
export const LowCarbonOptions = ConfigKeys.LowCarbonOptions;
export type LowCarbonOptions = typeof LowCarbonOptions[keyof typeof LowCarbonOptions];
export const NodeOptions = ConfigKeys.NodeOptions;
export type NodeOptions = typeof NodeOptions[keyof typeof NodeOptions];
export const OverridesOptions = ConfigKeys.OverridesOptions;
export type OverridesOptions = typeof OverridesOptions[keyof typeof OverridesOptions];
export const PowerOutageOptions = ConfigKeys.PowerOutageOptions;
export type PowerOutageOptions = typeof PowerOutageOptions[keyof typeof PowerOutageOptions];
export const SecondaryInfoOptions = ConfigKeys.SecondaryInfoOptions;
export type SecondaryInfoOptions = typeof SecondaryInfoOptions[keyof typeof SecondaryInfoOptions];

(() => {
  Object.keys(ConfigKeys).forEach(e => {
    const type = ConfigKeys[e];

    Object.defineProperty(type, "name", {
      value: e,
      configurable: true
    });
  });
})();

//================================================================================================================================================================================//
// Config structure                                                                                                                                                               //
//================================================================================================================================================================================//

export interface EnergyFlowCardExtConfig extends LovelaceCardConfig {
  [GlobalOptions.Title]?: string;
  [GlobalOptions.Date_Range]?: DateRange;
  [GlobalOptions.Date_Range_From]?: string;
  [GlobalOptions.Date_Range_To]?: string;
  [GlobalOptions.Date_Range_Live]?: boolean;
  [GlobalOptions.Date_Range_Display]?: DateRangeDisplayMode;
  [GlobalOptions.Use_HASS_Config]?: boolean,
  [EditorPages.Appearance]?: AppearanceConfig;
  [EditorPages.Grid]?: GridConfig;
  [EditorPages.Gas]?: GasConfig;
  [EditorPages.Low_Carbon]?: LowCarbonConfig;
  [EditorPages.Solar]?: SolarConfig;
  [EditorPages.Battery]?: BatteryConfig;
  [EditorPages.Home]?: HomeConfig;
  [EditorPages.Devices]?: DeviceConfig[];
}

export interface AppearanceConfig {
  [GlobalOptions.Options]?: AppearanceOptionsConfig;
  [AppearanceOptions.Energy_Units]?: EnergyUnitsConfig;
  [AppearanceOptions.Flows]?: FlowsConfig;
};

export interface AppearanceOptionsConfig {
  [AppearanceOptions.Dashboard_Link]?: string;
  [AppearanceOptions.Dashboard_Link_Label]?: string;
  [AppearanceOptions.Show_Zero_States]?: boolean;
  [AppearanceOptions.Clickable_Entities]?: boolean;
  [AppearanceOptions.Segment_Gaps]?: boolean;
  [AppearanceOptions.Use_HASS_Style]?: boolean;
};

export interface EnergyUnitsConfig {
  [EnergyUnitsOptions.Electric_Units]?: EnergyUnits;
  [EnergyUnitsOptions.Electric_Unit_Prefixes]?: UnitPrefixes;
  [EnergyUnitsOptions.Gas_Units]?: VolumeUnits;
  [EnergyUnitsOptions.Gas_Unit_Prefixes]?: UnitPrefixes;
  [EnergyUnitsOptions.Unit_Position]?: UnitPosition;
  [EnergyUnitsOptions.Display_Precision_Under_10]?: number;
  [EnergyUnitsOptions.Display_Precision_Under_100]?: number;
  [EnergyUnitsOptions.Display_Precision_Default]?: number;
  [EnergyUnitsOptions.Prefix_Threshold]?: PrefixThreshold;
  [EnergyUnitsOptions.Gas_Calorific_Value]?: number;
};

export interface FlowsConfig {
  [FlowsOptions.Use_Hourly_Stats]?: boolean;
  [FlowsOptions.Animation]?: boolean;
  [FlowsOptions.Inactive_Flows]?: InactiveFlowsMode;
  [FlowsOptions.Scale]?: Scale;
};

export interface LowCarbonOptionsConfig {
  [LowCarbonOptions.Low_Carbon_Mode]?: LowCarbonDisplayMode;
};

export interface HomeOptionsConfig {
  [HomeOptions.Gas_Sources]?: GasSourcesMode;
  [HomeOptions.Gas_Sources_Threshold]?: number;
  [HomeOptions.Subtract_Consumers]?: boolean;
};

export interface NodeConfig {
  [NodeOptions.Export_Entities]?: EntityConfig;
  [NodeOptions.Import_Entities]?: EntityConfig;
  [NodeOptions.Overrides]?: OverridesConfig;
  [NodeOptions.Secondary_Info]?: SecondaryInfoConfig;
  [NodeOptions.Colours]?: ColoursConfig;
};

export interface OverridesConfig {
  [OverridesOptions.Name]?: string;
  [OverridesOptions.Icon]?: string;
};

export interface ColoursConfig {
  [ColourOptions.Circle]?: ColourMode;
  [ColourOptions.Circle_Colour]?: number[];
  [ColourOptions.Flow_Export]?: ColourMode;
  [ColourOptions.Flow_Export_Colour]?: number[];
  [ColourOptions.Flow_Import]?: ColourMode;
  [ColourOptions.Flow_Import_Colour]?: number[];
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Icon_Colour]?: number[];
  [ColourOptions.Secondary]?: ColourMode;
  [ColourOptions.Secondary_Colour]?: number[];
  [ColourOptions.Value_Export]?: ColourMode;
  [ColourOptions.Value_Import_Colour]?: number[];
  [ColourOptions.Value_Import]?: ColourMode;
  [ColourOptions.Value_Export_Colour]?: number[];
};
export interface EntityConfig {
  [EntitiesOptions.Entity_Ids]?: string[];
}

export interface PowerOutageConfig {
  [PowerOutageOptions.Entity_Id]?: string;
  [PowerOutageOptions.Alert_State]?: string;
  [PowerOutageOptions.Alert_Icon]?: string;
};

export interface SecondaryInfoConfig {
  [SecondaryInfoOptions.Entity_Id]?: string;
  [SecondaryInfoOptions.Unit_Position]?: UnitPosition;
  [SecondaryInfoOptions.Display_Precision]?: number;
  [SecondaryInfoOptions.Icon]?: string;
};

//================================================================================================================================================================================//

export interface BatteryConfig extends NodeConfig {
};

export interface DeviceConfig extends NodeConfig {
  [DeviceOptions.Name]?: string;
  [DeviceOptions.Icon]?: string;
  [DeviceOptions.Energy_Type]?: EnergyType;
  [DeviceOptions.Energy_Direction]?: EnergyDirection;
};

export interface GasConfig extends NodeConfig {
};

export interface GridConfig extends NodeConfig {
  [GridOptions.Power_Outage]?: PowerOutageConfig;
};

export interface HomeConfig extends NodeConfig {
  [GlobalOptions.Options]?: HomeOptionsConfig;
};

export interface LowCarbonConfig extends NodeConfig {
  [GlobalOptions.Options]?: LowCarbonOptionsConfig;
};

export interface SolarConfig extends NodeConfig {
};

//================================================================================================================================================================================//

function isTotalisingEntity(hass: HomeAssistant, entityId: string = ""): boolean {
  return ["total", "total_increasing"].includes(hass.states[entityId]?.attributes?.state_class || "");
}

//================================================================================================================================================================================//

export function isValidPrimaryEntity(hass: HomeAssistant, entityId: string = "", deviceClasses: string[]): boolean {
  const deviceClass: string = hass.states[entityId]?.attributes?.device_class || DeviceClasses.None;

  if (deviceClass === DeviceClasses.None && deviceClasses.includes(deviceClass)) {
    return true;
  }

  return isTotalisingEntity(hass, entityId) && deviceClasses.includes(deviceClass);
}

//================================================================================================================================================================================//

export function isValidSecondaryEntity(hass: HomeAssistant, entityId: string = ""): boolean {
  return isTotalisingEntity(hass, entityId);
}

//================================================================================================================================================================================//
