import { any, assign, boolean, integer, number, object, optional, string, array } from 'superstruct';
import { AppearanceOptions, ColourOptions, DeviceOptions, EditorPages, EnergyUnitsOptions, NodeOptions, EntitiesOptions, FlowsOptions, GlobalOptions, GridOptions, HomeOptions, LowCarbonOptions, OverridesOptions, PowerOutageOptions, SecondaryInfoOptions } from '.';

const baseLovelaceCardConfigStruct = object({
  type: string(),
  view_layout: any(),
  layout_options: any(),
  grid_options: any(),
  visibility: any(),
  disabled: optional(boolean())
});

const appearanceOptionsConfigStruct = object({
  [AppearanceOptions.Dashboard_Link]: optional(string()),
  [AppearanceOptions.Dashboard_Link_Label]: optional(string()),
  [AppearanceOptions.Show_Zero_States]: optional(boolean()),
  [AppearanceOptions.Clickable_Entities]: optional(boolean()),
  [AppearanceOptions.Segment_Gaps]: optional(boolean()),
  [AppearanceOptions.Use_HASS_Style]: optional(boolean())
});

const energyUnitsOptionsConfigStruct = object({
  [EnergyUnitsOptions.Electric_Units]: optional(string()),
  [EnergyUnitsOptions.Electric_Unit_Prefixes]: optional(string()),
  [EnergyUnitsOptions.Gas_Units]: optional(string()),
  [EnergyUnitsOptions.Gas_Unit_Prefixes]: optional(string()),
  [EnergyUnitsOptions.Unit_Position]: optional(string()),
  [EnergyUnitsOptions.Display_Precision_Under_10]: optional(integer()),
  [EnergyUnitsOptions.Display_Precision_Under_100]: optional(integer()),
  [EnergyUnitsOptions.Display_Precision_Default]: optional(integer()),
  [EnergyUnitsOptions.Prefix_Threshold]: optional(number()),
  [EnergyUnitsOptions.Gas_Calorific_Value]: optional(number())
});

const flowsOptionsConfigStruct = object({
  [FlowsOptions.Use_Hourly_Stats]: optional(boolean()),
  [FlowsOptions.Animation]: optional(string()),
  [FlowsOptions.Inactive_Flows]: optional(string()),
  [FlowsOptions.Scale]: optional(string())
});

const appearanceConfigStruct = object({
  [GlobalOptions.Options]: optional(appearanceOptionsConfigStruct),
  [AppearanceOptions.Energy_Units]: optional(energyUnitsOptionsConfigStruct),
  [AppearanceOptions.Flows]: optional(flowsOptionsConfigStruct)
});

const entitiesConfigStruct = object({
  [EntitiesOptions.Entity_Ids]: optional(array())
});

const coloursConfigStruct = object({
  [ColourOptions.Circle]: optional(string()),
  [ColourOptions.Circle_Colour]: optional(array()),
  [ColourOptions.Flow_Import]: optional(string()),
  [ColourOptions.Flow_Import_Colour]: optional(array()),
  [ColourOptions.Flow_Export]: optional(string()),
  [ColourOptions.Flow_Export_Colour]: optional(array()),
  [ColourOptions.Icon]: optional(string()),
  [ColourOptions.Icon_Colour]: optional(array()),
  [ColourOptions.Secondary]: optional(string()),
  [ColourOptions.Secondary_Colour]: optional(array()),
  [ColourOptions.Value_Import]: optional(string()),
  [ColourOptions.Value_Import_Colour]: optional(array()),
  [ColourOptions.Value_Export]: optional(string()),
  [ColourOptions.Value_Export_Colour]: optional(array())
});

const overridesConfigStruct = object({
  [OverridesOptions.Name]: optional(string()),
  [OverridesOptions.Icon]: optional(string())
});

const secondaryInfoConfigStruct = object({
  [SecondaryInfoOptions.Entity_Id]: optional(string()),
  [SecondaryInfoOptions.Unit_Position]: optional(string()),
  [SecondaryInfoOptions.Display_Precision]: optional(number()),
  [SecondaryInfoOptions.Icon]: optional(string())
});

const nodeConfig = {
  [NodeOptions.Import_Entities]: optional(entitiesConfigStruct),
  [NodeOptions.Export_Entities]: optional(entitiesConfigStruct),
  [NodeOptions.Colours]: optional(coloursConfigStruct),
  [NodeOptions.Overrides]: optional(overridesConfigStruct),
  [NodeOptions.Secondary_Info]: optional(secondaryInfoConfigStruct)
};

const batteryConfigStruct = object({
  ...nodeConfig
});

const gasConfigStruct = object({
  ...nodeConfig
});

const powerOutageConfigStruct = object({
  [PowerOutageOptions.Entity_Id]: optional(string()),
  [PowerOutageOptions.Alert_State]: optional(string()),
  [PowerOutageOptions.Alert_Icon]: optional(string())
});

const gridConfigStruct = object({
  ...nodeConfig,
  [GridOptions.Power_Outage]: optional(powerOutageConfigStruct)
});

const homeOptionsConfigStruct = object({
  [HomeOptions.Gas_Sources]: optional(string()),
  [HomeOptions.Gas_Sources_Threshold]: optional(number()),
  [HomeOptions.Subtract_Consumers]: optional(boolean())
});

const homeConfigStruct = object({
  ...nodeConfig,
  [GlobalOptions.Options]: optional(homeOptionsConfigStruct)
});

const lowCarbonOptionsConfig = object({
  [LowCarbonOptions.Low_Carbon_Mode]: optional(string())
});

const lowCarbonConfigStruct = object({
  ...nodeConfig,
  [GlobalOptions.Options]: optional(lowCarbonOptionsConfig)
});

const solarConfigStruct = object({
  ...nodeConfig
});

const deviceConfigStruct = object({
  ...nodeConfig,
  [DeviceOptions.Name]: optional(string()),
  [DeviceOptions.Icon]: optional(string()),
  [DeviceOptions.Energy_Type]: optional(string()),
  [DeviceOptions.Energy_Direction]: optional(string()),
});

export const cardConfigStruct = assign(
  baseLovelaceCardConfigStruct,
  object({
    [GlobalOptions.Title]: optional(string()),
    [GlobalOptions.Date_Range]: optional(string()),
    [GlobalOptions.Date_Range_From]: optional(string()),
    [GlobalOptions.Date_Range_To]: optional(string()),
    [GlobalOptions.Date_Range_Live]: optional(boolean()),
    [GlobalOptions.Date_Range_Display]: optional(string()),
    [GlobalOptions.Use_HASS_Config]: optional(boolean()),
    [EditorPages.Appearance]: optional(appearanceConfigStruct),
    [EditorPages.Battery]: optional(batteryConfigStruct),
    [EditorPages.Gas]: optional(gasConfigStruct),
    [EditorPages.Grid]: optional(gridConfigStruct),
    [EditorPages.Home]: optional(homeConfigStruct),
    [EditorPages.Low_Carbon]: optional(lowCarbonConfigStruct),
    [EditorPages.Solar]: optional(solarConfigStruct),
    [EditorPages.Devices]: optional(array(deviceConfigStruct))
  })
);
