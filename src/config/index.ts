import { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';
import { ColourMode, DeviceType, DisplayMode, DotsMode, LowCarbonType, InactiveLinesMode, UnitPosition, UnitPrefixes } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';

declare global {
  interface HTMLElementTagNameMap {
    'hui-error-card': LovelaceCard;
  }
}

//================================================================================================================================================================================//
// These act both as keys in the YAML config, and as the names of the fields in the below Config interfaces                                                                       //
//================================================================================================================================================================================//

export enum EditorPages {
  Appearance = "appearance",
  Grid = "grid",
  Gas = "gas",
  Solar = "solar",
  Battery = "battery",
  Low_Carbon = "low_carbon_energy",
  Home = "home",
  Devices = "devices"
};

export enum GlobalOptions {
  Title = "title",
  Display_Mode = "display_mode",
  Options = "options"
};

export enum AppearanceOptions {
  Dashboard_Link = "dashboard_link",
  Dashboard_Link_Label = "dashboard_link_label",
  Show_Zero_States = "show_zero_states",
  Clickable_Entities = "clickable_entities",
  Segment_Gaps = "segment_gaps",
  Energy_Units = "energy_units",
  Flows = "flows"
};

export enum EnergyUnitsOptions {
  Unit_Prefixes = "unit_prefixes",
  Unit_Position = "unit_position",
  Kwh_Display_Precision = "kwh_display_precision",
  Mwh_Display_Precision = "mwh_display_precision",
  Wh_Kwh_Threshold = "wh_kwh_threshold",
  Kwh_Mwh_Threshold = "kwh_mwh_threshold"
};

export enum FlowsOptions {
  Use_Hourly_Stats = "use_hourly_stats",
  Use_HASS_Colours = "use_hass_colours",
  Animation = "animation",
  Inactive_Lines = "inactive_lines",
  Min_Rate = "min_rate",
  Max_Rate = "max_rate",
  Min_Energy = "min_energy",
  Max_Energy = "max_energy"
};

export enum EntitiesOptions {
  Entities = "entities",
  Import_Entities = "import_entities",
  Export_Entities = "export_entities",
  Colours = "colours",
  Overrides = "overrides",
  Secondary_Info = "secondary_info",
  Include_In_Home = "include_in_home",
  Low_Carbon_Mode = "low_carbon_mode",
  Device_Type = "device_type"
};

export enum EntityOptions {
  Entity_Id = "entity_id",
  Entity_Ids = "entity_ids",
  Units = "units",
  Unit_Position = "unit_position",
  Zero_Threshold = "zero_threshold",
  Display_Precision = "display_precision"
};

export enum ColourOptions {
  Circle = "colour_of_circle",
  Icon = "colour_of_icon",
  Values = "colour_of_values",
  Value = "colour_of_value",
  Custom_Colour = "custom_colour",
  Import_Colour = "import_colour",
  Export_Colour = "export_colour"
};

export enum PowerOutageOptions {
  Power_Outage = "power_outage",
  Label_Alert = "label_alert",
  Icon_Alert = "icon_alert",
  State_Alert = "state_alert"
};

export enum OverridesOptions {
  Name = "name",
  Icon = "icon"
};

export enum SecondaryInfoOptions {
  Icon = "secondary_icon"
}

export enum DeviceOptions {
  Name = "device_name",
  Icon = "device_icon"
}

//================================================================================================================================================================================//
// Config structure                                                                                                                                                               //
//================================================================================================================================================================================//

export interface EnergyFlowCardExtConfig extends LovelaceCardConfig {
  [GlobalOptions.Title]?: string;
  [GlobalOptions.Display_Mode]?: DisplayMode;
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
};

export interface EnergyUnitsConfig {
  [EnergyUnitsOptions.Unit_Prefixes]?: UnitPrefixes;
  [EnergyUnitsOptions.Unit_Position]?: UnitPosition;
  [EnergyUnitsOptions.Kwh_Display_Precision]?: number;
  [EnergyUnitsOptions.Mwh_Display_Precision]?: number;
  [EnergyUnitsOptions.Wh_Kwh_Threshold]?: number;
  [EnergyUnitsOptions.Kwh_Mwh_Threshold]?: number;
};

export interface FlowsConfig {
  [FlowsOptions.Use_Hourly_Stats]?: boolean;
  [FlowsOptions.Use_HASS_Colours]?: boolean;
  [FlowsOptions.Animation]?: DotsMode;
  [FlowsOptions.Inactive_Lines]?: InactiveLinesMode;
  [FlowsOptions.Min_Rate]?: number;
  [FlowsOptions.Max_Rate]?: number;
  [FlowsOptions.Min_Energy]?: number;
  [FlowsOptions.Max_Energy]?: number;
};

export interface GridConfig extends DualValueNodeConfig {
  [PowerOutageOptions.Power_Outage]?: PowerOutageConfig;
};

export interface GasConfig extends SingleValueNodeConfig {
  [EntitiesOptions.Include_In_Home]?: boolean;
};

export interface LowCarbonConfig extends NodeConfig {
  [EntitiesOptions.Colours]?: SingleValueColourConfig;
  [GlobalOptions.Options]?: LowCarbonOptionsConfig;
};

export interface LowCarbonOptionsConfig {
  [EntitiesOptions.Low_Carbon_Mode]?: LowCarbonType;
};

export interface SolarConfig extends SingleValueNodeConfig {
};

export interface BatteryConfig extends DualValueNodeConfig {
};

export interface HomeConfig extends NodeConfig {
  [EntitiesOptions.Colours]?: SingleValueColourConfig;
};

export interface DeviceConfig {
  [DeviceOptions.Name]?: string;
  [DeviceOptions.Icon]?: string;
  [EntitiesOptions.Entities]?: EntityConfig;
  [EntitiesOptions.Colours]?: SingleValueColourConfig;
  [EntitiesOptions.Secondary_Info]?: SecondaryInfoConfig;
  [GlobalOptions.Options]?: DeviceOptionsConfig;
};

export interface DeviceOptionsConfig {
  [EntitiesOptions.Device_Type]?: DeviceType;
  [EntitiesOptions.Include_In_Home]?: boolean;
};

export interface NodeConfig {
  [EntitiesOptions.Overrides]?: OverridesConfig;
  [EntitiesOptions.Secondary_Info]?: SecondaryInfoConfig;
};

export interface OverridesConfig {
  [OverridesOptions.Name]?: string;
  [OverridesOptions.Icon]?: string;
};

export interface SingleValueNodeConfig extends NodeConfig {
  [EntitiesOptions.Entities]?: EntityConfig;
  [EntitiesOptions.Colours]?: SingleValueColourConfig;
};

export interface DualValueNodeConfig extends NodeConfig {
  [EntitiesOptions.Import_Entities]?: EntityConfig;
  [EntitiesOptions.Export_Entities]?: EntityConfig;
  [EntitiesOptions.Colours]?: DualValueColourConfig;
};

interface ValueColourConfig {
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Circle]?: ColourMode;
};

export interface SingleValueColourConfig extends ValueColourConfig {
  [ColourOptions.Value]?: ColourMode;
  [ColourOptions.Custom_Colour]?: number[];
};

export interface DualValueColourConfig extends ValueColourConfig {
  [ColourOptions.Values]?: ColourMode;
  [ColourOptions.Import_Colour]?: number[];
  [ColourOptions.Export_Colour]?: number[];
};

export interface EntityConfig {
  [EntityOptions.Entity_Ids]?: string[];
}

export interface PowerOutageConfig {
  [EntityOptions.Entity_Id]?: string;
  [PowerOutageOptions.State_Alert]?: string;
  [PowerOutageOptions.Label_Alert]?: string;
  [PowerOutageOptions.Icon_Alert]?: string;
};

export interface SecondaryInfoConfig {
  [EntityOptions.Entity_Id]?: string;
  [EntityOptions.Units]?: string;
  [EntityOptions.Unit_Position]?: UnitPosition;
  [EntityOptions.Zero_Threshold]?: number;
  [EntityOptions.Display_Precision]?: number;
  [SecondaryInfoOptions.Icon]?: string;
};


const isTotalisingEntity = (hass: HomeAssistant, entityId: string = ""): boolean => ["total", "total_increasing"].includes(hass.states[entityId]?.attributes?.state_class || "");

export const isValidPrimaryEntity = (hass: HomeAssistant, entityId: string = ""): boolean => isTotalisingEntity(hass, entityId) && hass.states[entityId]?.attributes?.device_class === DEVICE_CLASS_ENERGY;
export const isValidSecondaryEntity = (hass: HomeAssistant, entityId: string = ""): boolean => isTotalisingEntity(hass, entityId);

export const filterPrimaryEntities = (hass: HomeAssistant, entityIds: string[] = []): string[] => entityIds.filter(entityId => isValidPrimaryEntity(hass, entityId));
export const filterSecondaryEntity = (hass: HomeAssistant, entityId: string = ""): string[] => isValidSecondaryEntity(hass, entityId) ? [entityId] : [];
