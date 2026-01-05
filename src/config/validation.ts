import { any, assign, boolean, integer, number, object, optional, string, array } from 'superstruct';
import { AppearanceOptions, ColourOptions, DeviceOptions, EditorPages, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, HomeOptions, OverridesOptions, PowerOutageOptions, SecondaryInfoOptions } from '.';

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
  [AppearanceOptions.Segment_Gaps]: optional(boolean())
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
  [EnergyUnitsOptions.Prefix_Threshold]: optional(integer()),
  [EnergyUnitsOptions.Gas_Calorific_Value]: optional(number())
});

const flowsOptionsConfigStruct = object({
  [FlowsOptions.Use_Hourly_Stats]: optional(boolean()),
  [FlowsOptions.Use_HASS_Style]: optional(boolean()),
  [FlowsOptions.Animation]: optional(boolean()),
  [FlowsOptions.Inactive_Flows]: optional(string()),
  [FlowsOptions.Scale]: optional(string())
});

const appearanceConfigStruct = object({
  [GlobalOptions.Options]: optional(appearanceOptionsConfigStruct),
  [AppearanceOptions.Energy_Units]: optional(energyUnitsOptionsConfigStruct),
  [AppearanceOptions.Flows]: optional(flowsOptionsConfigStruct)
});

const entitiesConfigStruct = object({
  [EntityOptions.Entity_Ids]: optional(array())
});

const singleValueColoursConfigStruct = object({
  [ColourOptions.Circle]: optional(string()),
  [ColourOptions.Circle_Colour]: optional(array()),
  [ColourOptions.Flow]: optional(string()),
  [ColourOptions.Flow_Colour]: optional(array()),
  [ColourOptions.Icon]: optional(string()),
  [ColourOptions.Icon_Colour]: optional(array()),
  [ColourOptions.Secondary]: optional(string()),
  [ColourOptions.Secondary_Colour]: optional(array()),
  [ColourOptions.Value]: optional(string()),
  [ColourOptions.Value_Colour]: optional(array())
});

const dualValueColoursConfigStruct = object({
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
  [EntityOptions.Entity_Id]: optional(string()),
  [SecondaryInfoOptions.Units]: optional(string()),
  [EntityOptions.Unit_Position]: optional(string()),
  [SecondaryInfoOptions.Zero_Threshold]: optional(number()),
  [SecondaryInfoOptions.Display_Precision]: optional(number()),
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
  [ColourOptions.Circle_Colour]: optional(array()),
  [ColourOptions.Icon]: optional(string()),
  [ColourOptions.Icon_Colour]: optional(array()),
  [ColourOptions.Secondary]: optional(string()),
  [ColourOptions.Secondary_Colour]: optional(array()),
  [ColourOptions.Value]: optional(string()),
  [ColourOptions.Value_Colour]: optional(array())
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

const deviceColoursConfigStruct = object({
  [ColourOptions.Circle]: optional(string()),
  [ColourOptions.Circle_Colour]: optional(array()),
  [ColourOptions.Flow_Import_Colour]: optional(array()),
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

const deviceConfigStruct = object({
  [DeviceOptions.Name]: optional(string()),
  [DeviceOptions.Icon]: optional(string()),
  [DeviceOptions.Energy_Type]: optional(string()),
  [DeviceOptions.Energy_Direction]: optional(string()),
  [EntitiesOptions.Import_Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Export_Entities]: optional(entitiesConfigStruct),
  [EntitiesOptions.Colours]: optional(deviceColoursConfigStruct),
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
