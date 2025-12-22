import { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';
import { ColourMode, DisplayMode, LowCarbonType, InactiveFlowsMode, UnitPosition, UnitPrefixes, EnergyDirection, EnergyType, GasSourcesMode, Scale } from '@/enums';
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
  Display_Precision_Under_10 = "display_precision_under_10",
  Display_Precision_Under_100 = "display_precision_under_100",
  Display_Precision_Default = "display_precision_default",
  Wh_Kwh_Threshold = "wh_kwh_threshold",
  Kwh_Mwh_Threshold = "kwh_mwh_threshold"
};

export enum FlowsOptions {
  Use_Hourly_Stats = "use_hourly_stats",
  Use_HASS_Style = "use_hass_style",
  Animation = "animation",
  Inactive_Flows = "inactive_flows",
  Scale = "scale",
  Min_Rate = "min_rate",
  Max_Rate = "max_rate"
};

export enum EntitiesOptions {
  Entities = "entities",
  Import_Entities = "import_entities",
  Export_Entities = "export_entities",
  Colours = "colours",
  Overrides = "overrides",
  Secondary_Info = "secondary_info",
  Low_Carbon_Mode = "low_carbon_mode"
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
  Icon = "secondary_icon"
}

export enum DeviceOptions {
  Name = "device_name",
  Icon = "device_icon",
  Energy_Type = "energy_type",
  Energy_Direction = "energy_direction"
}

export enum HomeOptions {
  Gas_Sources = "gas_sources",
  Gas_Sources_Threshold = "threshold",
  Subtract_Consumers = "subtract_consumers"
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
  [EnergyUnitsOptions.Display_Precision_Under_10]?: number;
  [EnergyUnitsOptions.Display_Precision_Under_100]?: number;
  [EnergyUnitsOptions.Display_Precision_Default]?: number;
  [EnergyUnitsOptions.Wh_Kwh_Threshold]?: number;
  [EnergyUnitsOptions.Kwh_Mwh_Threshold]?: number;
};

export interface FlowsConfig {
  [FlowsOptions.Use_Hourly_Stats]?: boolean;
  [FlowsOptions.Use_HASS_Style]?: boolean;
  [FlowsOptions.Animation]?: boolean;
  [FlowsOptions.Inactive_Flows]?: InactiveFlowsMode;
  [FlowsOptions.Scale]?: Scale;
  [FlowsOptions.Min_Rate]?: number;
  [FlowsOptions.Max_Rate]?: number;

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
  [EntitiesOptions.Low_Carbon_Mode]?: LowCarbonType;
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
  [EntityOptions.Units]?: string;
  [EntityOptions.Unit_Position]?: UnitPosition;
  [EntityOptions.Zero_Threshold]?: number;
  [EntityOptions.Display_Precision]?: number;
  [SecondaryInfoOptions.Icon]?: string;
};

//================================================================================================================================================================================//

const isTotalisingEntity = (hass: HomeAssistant, entityId: string = ""): boolean => ["total", "total_increasing"].includes(hass.states[entityId]?.attributes?.state_class || "");

export const isValidPrimaryEntity = (hass: HomeAssistant, entityId: string = ""): boolean => isTotalisingEntity(hass, entityId) && hass.states[entityId]?.attributes?.device_class === DEVICE_CLASS_ENERGY;
export const isValidSecondaryEntity = (hass: HomeAssistant, entityId: string = ""): boolean => isTotalisingEntity(hass, entityId);

export const filterPrimaryEntities = (hass: HomeAssistant, entityIds: string[] = []): string[] => entityIds.filter(entityId => isValidPrimaryEntity(hass, entityId));
export const filterSecondaryEntity = (hass: HomeAssistant, entityId: string = ""): string[] => isValidSecondaryEntity(hass, entityId) ? [entityId] : [];

//================================================================================================================================================================================//
