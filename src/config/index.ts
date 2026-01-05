import { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';
import { ColourMode, DisplayMode, LowCarbonDisplayMode, InactiveFlowsMode, UnitPosition, UnitPrefixes, EnergyDirection, EnergyType, GasSourcesMode, Scale, EnergyUnits, VolumeUnits } from '@/enums';

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
  Use_HASS_Style = "use_hass_style",
  Energy_Units = "energy_units",
  Flows = "flows"
};

export enum EnergyUnitsOptions {
  Electric_Units = "electric_units",
  Gas_Units = "gas_units",
  Electric_Unit_Prefixes = "electric_unit_prefixes",
  Gas_Unit_Prefixes = "gas_unit_prefixes",
  Unit_Position = "unit_position",
  Display_Precision_Under_10 = "display_precision_under_10",
  Display_Precision_Under_100 = "display_precision_under_100",
  Display_Precision_Default = "display_precision_default",
  Prefix_Threshold = "prefix_threshold",
  Gas_Calorific_Value = "gas_calorific_value"
};

export enum FlowsOptions {
  Use_Hourly_Stats = "use_hourly_stats",
  Animation = "animation",
  Inactive_Flows = "inactive_flows",
  Scale = "scale"
};

export enum EntitiesOptions {
  Entities = "entities",
  Import_Entities = "import_entities",
  Export_Entities = "export_entities",
  Colours = "colours",
  Overrides = "overrides",
  Secondary_Info = "secondary_info"
};

export enum EntityOptions {
  Entity_Id = "entity_id",
  Entity_Ids = "entity_ids"
};

export enum ColourOptions {
  Circle = "circle_mode",
  Circle_Colour = "circle_colour",
  Flow = "flow_mode",
  Flow_Colour = "flow_colour",
  Flow_Export = "flow_export_mode",
  Flow_Export_Colour = "flow_export_colour",
  Flow_Import = "flow_import_mode",
  Flow_Import_Colour = "flow_import_colour",
  Icon = "icon_mode",
  Icon_Colour = "icon_colour",
  Secondary = "secondary_mode",
  Secondary_Colour = "secondary_colour",
  Value = "value_mode",
  Value_Colour = "value_colour",
  Value_Export = "value_export_mode",
  Value_Export_Colour = "value_export_colour",
  Value_Import = "value_import_mode",
  Value_Import_Colour = "value_import_colour"
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
  Icon = "secondary_icon",
  Units = "units",
  Zero_Threshold = "zero_threshold",
  Display_Precision = "display_precision",
  Unit_Position = "unit_position"
}

export enum DeviceOptions {
  Name = "device_name",
  Icon = "device_icon",
  Energy_Type = "energy_type",
  Energy_Direction = "energy_direction"
}

export enum HomeOptions {
  Gas_Sources = "gas_sources",
  Gas_Sources_Threshold = "gas_sources_threshold",
  Subtract_Consumers = "subtract_consumers"
}

export enum LowCarbonOptions {
  Low_Carbon_Mode = "low_carbon_mode"
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
  [EnergyUnitsOptions.Prefix_Threshold]?: number;
  [EnergyUnitsOptions.Gas_Calorific_Value]?: number;
};

export interface FlowsConfig {
  [FlowsOptions.Use_Hourly_Stats]?: boolean;
  [FlowsOptions.Animation]?: boolean;
  [FlowsOptions.Inactive_Flows]?: InactiveFlowsMode;
  [FlowsOptions.Scale]?: Scale;
};

export interface GridConfig extends DualValueNodeConfig {
  [PowerOutageOptions.Power_Outage]?: PowerOutageConfig;
};

export interface GasConfig extends SingleValueNodeConfig {
};

export interface LowCarbonConfig extends NodeConfig {
  [EntitiesOptions.Colours]?: SingleValueColourConfig;
  [GlobalOptions.Options]?: LowCarbonOptionsConfig;
};

export interface LowCarbonOptionsConfig {
  [LowCarbonOptions.Low_Carbon_Mode]?: LowCarbonDisplayMode;
};

export interface SolarConfig extends SingleValueNodeConfig {
};

export interface BatteryConfig extends DualValueNodeConfig {
};

export interface HomeColourConfig {
  [ColourOptions.Circle]?: ColourMode;
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Secondary]?: ColourMode;
  [ColourOptions.Value]?: ColourMode;
};

export interface HomeConfig extends NodeConfig {
  [EntitiesOptions.Colours]?: HomeColourConfig;
  [GlobalOptions.Options]?: HomeOptionsConfig;
};

export interface HomeOptionsConfig {
  [HomeOptions.Gas_Sources]?: GasSourcesMode;
  [HomeOptions.Gas_Sources_Threshold]?: number;
  [HomeOptions.Subtract_Consumers]?: boolean;
};

export interface DeviceConfig {
  [DeviceOptions.Name]?: string;
  [DeviceOptions.Icon]?: string;
  [DeviceOptions.Energy_Type]?: EnergyType;
  [DeviceOptions.Energy_Direction]?: EnergyDirection;
  [EntitiesOptions.Import_Entities]?: EntityConfig;
  [EntitiesOptions.Export_Entities]?: EntityConfig;
  [EntitiesOptions.Colours]?: DeviceColourConfig;
  [EntitiesOptions.Secondary_Info]?: SecondaryInfoConfig;
};

export interface DeviceColourConfig {
  [ColourOptions.Circle]?: ColourMode;
  [ColourOptions.Circle_Colour]?: number[];
  [ColourOptions.Flow_Import_Colour]?: number[];
  [ColourOptions.Flow_Export_Colour]?: number[];
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Icon_Colour]?: number[];
  [ColourOptions.Secondary]?: ColourMode;
  [ColourOptions.Secondary_Colour]?: number[];
  [ColourOptions.Value_Import]?: ColourMode;
  [ColourOptions.Value_Export_Colour]?: number[];
  [ColourOptions.Value_Export]?: ColourMode;
  [ColourOptions.Value_Import_Colour]?: number[];
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

export interface SingleValueColourConfig {
  [ColourOptions.Circle]?: ColourMode;
  [ColourOptions.Circle_Colour]?: number[];
  [ColourOptions.Flow]?: ColourMode;
  [ColourOptions.Flow_Colour]?: number[];
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Icon_Colour]?: number[];
  [ColourOptions.Secondary]?: ColourMode;
  [ColourOptions.Secondary_Colour]?: number[];
  [ColourOptions.Value]?: ColourMode;
  [ColourOptions.Value_Colour]?: number[];
};

export interface DualValueColourConfig {
  [ColourOptions.Circle]?: ColourMode;
  [ColourOptions.Circle_Colour]?: number[];
  [ColourOptions.Flow_Import]?: ColourMode;
  [ColourOptions.Flow_Import_Colour]?: number[];
  [ColourOptions.Flow_Export]?: ColourMode;
  [ColourOptions.Flow_Export_Colour]?: number[];
  [ColourOptions.Icon]?: ColourMode;
  [ColourOptions.Icon_Colour]?: number[];
  [ColourOptions.Secondary]?: ColourMode;
  [ColourOptions.Secondary_Colour]?: number[];
  [ColourOptions.Value_Import]?: ColourMode;
  [ColourOptions.Value_Export_Colour]?: number[];
  [ColourOptions.Value_Export]?: ColourMode;
  [ColourOptions.Value_Import_Colour]?: number[];
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
  [SecondaryInfoOptions.Units]?: string;
  [SecondaryInfoOptions.Unit_Position]?: UnitPosition;
  [SecondaryInfoOptions.Zero_Threshold]?: number;
  [SecondaryInfoOptions.Display_Precision]?: number;
  [SecondaryInfoOptions.Icon]?: string;
};

//================================================================================================================================================================================//

function isTotalisingEntity(hass: HomeAssistant, entityId: string = ""): boolean {
  return ["total", "total_increasing"].includes(hass.states[entityId]?.attributes?.state_class || "");
}

//================================================================================================================================================================================//

export function isValidPrimaryEntity(hass: HomeAssistant, entityId: string = "", deviceClasses: string[]): boolean {
  return isTotalisingEntity(hass, entityId) && deviceClasses.includes(hass.states[entityId]?.attributes?.device_class!);
}

//================================================================================================================================================================================//

export function isValidSecondaryEntity(hass: HomeAssistant, entityId: string = ""): boolean {
  return isTotalisingEntity(hass, entityId);
}

//================================================================================================================================================================================//

export function filterPrimaryEntities(hass: HomeAssistant, entityIds: string[] = [], deviceClasses: string[]): string[] {
  return entityIds.filter(entityId => isValidPrimaryEntity(hass, entityId, deviceClasses));
}

//================================================================================================================================================================================//

export function filterSecondaryEntity(hass: HomeAssistant, entityId: string = ""): string[] {
  return isValidSecondaryEntity(hass, entityId) ? [entityId] : [];
}

//================================================================================================================================================================================//
