import { any, assign, boolean, integer, number, object, optional, string, array } from 'superstruct';
import { AppearanceOptions, ColourOptions, DeviceOptions, EditorPages, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, HomeOptions, OverridesOptions, PowerOutageOptions, SecondaryInfoOptions } from '.';

const baseLovelaceCardConfigStruct = object({
  type: string(),
  view_layout: any(),
});

const appearanceOptionsConfigStruct = object({
  [AppearanceOptions.Dashboard_Link]: optional(string()),
  [AppearanceOptions.Dashboard_Link_Label]: optional(string()),
  [AppearanceOptions.Show_Zero_States]: optional(boolean()),
  [AppearanceOptions.Clickable_Entities]: optional(boolean()),
  [AppearanceOptions.Segment_Gaps]: optional(boolean())
});

const energyUnitsOptionsConfigStruct = object({
  [EnergyUnitsOptions.Unit_Prefixes]: optional(string()),
  [EnergyUnitsOptions.Unit_Position]: optional(string()),
  [EnergyUnitsOptions.Display_Precision_Under_10]: optional(integer()),
  [EnergyUnitsOptions.Display_Precision_Under_100]: optional(integer()),
  [EnergyUnitsOptions.Display_Precision_Default]: optional(integer()),
  [EnergyUnitsOptions.Wh_Kwh_Threshold]: optional(number()),
  [EnergyUnitsOptions.Kwh_Mwh_Threshold]: optional(number())
});

const flowsOptionsConfigStruct = object({
  [FlowsOptions.Use_Hourly_Stats]: optional(boolean()),
  [FlowsOptions.Use_HASS_Colours]: optional(boolean()),
  [FlowsOptions.Animation]: optional(string()),
  [FlowsOptions.Inactive_Flows]: optional(string()),
  [FlowsOptions.Min_Rate]: optional(number()),
  [FlowsOptions.Max_Rate]: optional(number()),
  [FlowsOptions.Min_Energy]: optional(number()),
  [FlowsOptions.Max_Energy]: optional(number())
});

const appearanceConfigStruct = object({
  [GlobalOptions.Options]: optional(appearanceOptionsConfigStruct),
  [AppearanceOptions.Energy_Units]: optional(energyUnitsOptionsConfigStruct),
  [AppearanceOptions.Flows]: optional(flowsOptionsConfigStruct)
});

const entitiesConfigStruct = object({
  [EntityOptions.Entity_Ids]: optional(array())
});

const valueColoursConfig = {
  [ColourOptions.Icon]: optional(string()),
  [ColourOptions.Circle]: optional(string())
};

const singleValueColoursConfigStruct = object({
  ...valueColoursConfig,
  [ColourOptions.Flow]: optional(string()),
  [ColourOptions.Custom_Colour]: optional(array()),
  [ColourOptions.Value]: optional(string())
});

const dualValueColoursConfigStruct = object({
  ...valueColoursConfig,
  [ColourOptions.Import_Flow]: optional(string()),
  [ColourOptions.Export_Flow]: optional(string()),
  [ColourOptions.Import_Colour]: optional(array()),
  [ColourOptions.Export_Colour]: optional(array()),
  [ColourOptions.Values]: optional(string())
});

const overridesConfigStruct = object({
  [OverridesOptions.Name]: optional(string()),
  [OverridesOptions.Icon]: optional(string())
});

const secondaryInfoConfigStruct = object({
  [EntityOptions.Entity_Id]: optional(string()),
  [EntityOptions.Units]: optional(string()),
  [EntityOptions.Unit_Position]: optional(string()),
  [EntityOptions.Zero_Threshold]: optional(number()),
  [EntityOptions.Display_Precision]: optional(number()),
  [SecondaryInfoOptions.Icon]: optional(string())
});

const nodeConfig = {
  [EntitiesOptions.Overrides]: optional(overridesConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct)
};

const singleValueNodeConfig = {
  ...nodeConfig,
  [EntitiesOptions.Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Colours]: optional(singleValueColoursConfigStruct)
};

const dualValueNodeConfig = {
  ...nodeConfig,
  [EntitiesOptions.Import_Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Export_Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Colours]: optional(dualValueColoursConfigStruct)
};

const batteryConfigStruct = object({
  ...dualValueNodeConfig,
  [EntitiesOptions.Overrides]: optional(overridesConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct)
});

const gasConfigStruct = object({
  ...singleValueNodeConfig
});

const powerOutageConfigStruct = object({
  [EntityOptions.Entity_Id]: optional(string()),
  [PowerOutageOptions.State_Alert]: optional(string()),
  [PowerOutageOptions.Label_Alert]: optional(string()),
  [PowerOutageOptions.Icon_Alert]: optional(string())

});

const gridConfigStruct = object({
  ...dualValueNodeConfig,
  [EntitiesOptions.Overrides]: optional(overridesConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct),
  [PowerOutageOptions.Power_Outage]: optional(powerOutageConfigStruct)
});

const homeOptionsConfigStruct = object({
  [HomeOptions.Gas_Sources]: optional(string()),
  [HomeOptions.Gas_Sources_Threshold]: optional(number()),
  [HomeOptions.Subtract_Consumers]: optional(boolean())
});

const homeColoursConfigStruct = object({
  [ColourOptions.Circle]: optional(string()),
  [ColourOptions.Icon]: optional(string()),
  [ColourOptions.Values]: optional(string()),
});

const homeConfigStruct = object({
  ...nodeConfig,
  [EntitiesOptions.Colours]: optional(homeColoursConfigStruct),
  [GlobalOptions.Options]: optional(homeOptionsConfigStruct)
});

const lowCarbonOptionsConfig = object({
  [EntitiesOptions.Low_Carbon_Mode]: optional(string())
});

const lowCarbonConfigStruct = object({
  ...singleValueNodeConfig,
  [EntitiesOptions.Overrides]: optional(overridesConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct),
  [GlobalOptions.Options]: optional(lowCarbonOptionsConfig)
});

const solarConfigStruct = object({
  ...singleValueNodeConfig,
  [EntitiesOptions.Overrides]: optional(overridesConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct)
});

const deviceConfigStruct = object({
  [DeviceOptions.Name]: optional(string()),
  [DeviceOptions.Icon]: optional(string()),
  [DeviceOptions.EnergyType]: optional(string()),
  [DeviceOptions.EnergyDirection]: optional(string()),
  [EntitiesOptions.Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Colours]: optional(singleValueColoursConfigStruct),
  [EntitiesOptions.Secondary_Info]: optional(secondaryInfoConfigStruct)
});

export const cardConfigStruct = assign(
  baseLovelaceCardConfigStruct,
  object({
    [GlobalOptions.Title]: optional(string()),
    [GlobalOptions.Display_Mode]: optional(string()),
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
