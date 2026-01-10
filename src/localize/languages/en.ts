import { AppearanceOptions, ColourOptions, DeviceOptions, EditorPages, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, GridOptions, HomeOptions, LowCarbonOptions, OverridesOptions, PowerOutageOptions, SecondaryInfoOptions } from "@/config";
import { ColourMode, DisplayMode, EnergyDirection, EnergyType, EnergyUnits, GasSourcesMode, InactiveFlowsMode, LowCarbonDisplayMode, Scale, UnitPosition, UnitPrefixes, VolumeUnits } from "@/enums";
import { HELPTEXT_SUFFIX } from "@/const";

export default {
  "common": {
    "go_to_dashboard": "Go to the {title} dashboard",
    "initialising": "Initializing...",
    "invalid_configuration": "Invalid configuration",
    "loading": "Loading data...",
    "low_carbon": "Low-carbon",
    "new_device": "New Device",
    "no_date_picker": "This display mode requires a Date Selector to be present in this View",
    "power_outage": "Power outage",
    "unknown": "Unknown"
  },

  "editor": {
    "add_device": "Add Device",
    "go_back": "Go Back",
    "invalid_primary_entity": "is not an energy sensor of type Total or Total_Increasing",
    "invalid_secondary_entity": "is not of type Total or Total_Increasing",
    "missing_entity": "Entity must be specified",
    "next": "Next",
    "previous": "Previous",
    "remove_device": "Remove Device"
  },

  "AppearanceOptions": {
    [AppearanceOptions.Clickable_Entities]: "Clickable entities",
    [AppearanceOptions.Dashboard_Link]: "Dashboard link",
    [AppearanceOptions.Dashboard_Link_Label]: "Dashboard link label",
    [AppearanceOptions.Energy_Units]: "Energy Units",
    [AppearanceOptions.Flows]: "Flows",
    [AppearanceOptions.Segment_Gaps]: "Show gaps between circle segments",
    [AppearanceOptions.Show_Zero_States]: "Show zero states",
    [AppearanceOptions.Use_HASS_Style]: "Use HASS-style layout and colors"
  },

  "ColourMode": {
    [ColourMode.Do_Not_Colour]: "Do not color",
    [ColourMode.Flow]: "Same as flow",
    [ColourMode.Larger_Value]: "Larger value",
    [ColourMode.Largest_Value]: "Largest value",
    [ColourMode.Import]: "Import",
    [ColourMode.Export]: "Export",
    [ColourMode.Dynamic]: "Color dynamically",
    [ColourMode.Solar]: "Solar",
    [ColourMode.High_Carbon]: "High-carbon",
    [ColourMode.Low_Carbon]: "Low-carbon",
    [ColourMode.Battery]: "Battery",
    [ColourMode.Gas]: "Gas",
    [ColourMode.Custom]: "Custom",
    [ColourMode.Default]: "Default"
  },

  "ColourOptions": {
    [ColourOptions.Circle]: "Circle",
    [ColourOptions.Circle_Colour]: "Circle color",
    [ColourOptions.Flow]: "Flow",
    [ColourOptions.Flow_Colour]: "Flow color",
    [ColourOptions.Flow_Export]: "Export flow",
    [ColourOptions.Flow_Export_Colour]: "Export color",
    [ColourOptions.Flow_Import]: "Import flow",
    [ColourOptions.Flow_Import_Colour]: "Import color",
    [ColourOptions.Icon]: "Icon",
    [ColourOptions.Icon_Colour]: "Icon color",
    [ColourOptions.Secondary]: "Secondary value",
    [ColourOptions.Secondary_Colour]: "Secondary value color",
    [ColourOptions.Value]: "Value",
    [ColourOptions.Value_Colour]: "Value color",
    [ColourOptions.Value_Export]: "Export value",
    [ColourOptions.Value_Export_Colour]: "Export color",
    [ColourOptions.Value_Import]: "Import value",
    [ColourOptions.Value_Import_Colour]: "Import color"
  },

  "DeviceOptions": {
    [DeviceOptions.Energy_Direction]: "Direction",
    [DeviceOptions.Energy_Type]: "Type",
    [DeviceOptions.Icon]: "Icon",
    [DeviceOptions.Name]: "Name"
  },

  "DisplayMode": {
    [DisplayMode.Today]: "Today",
    [DisplayMode.History]: "History",
    [DisplayMode.Hybrid]: "Hybrid"
  },

  "EditorPages": {
    [EditorPages.Appearance]: "Appearance",
    [EditorPages.Battery]: "Battery",
    [EditorPages.Devices]: "Devices",
    [EditorPages.Gas]: "Gas",
    [EditorPages.Grid]: "Grid",
    [EditorPages.Home]: "Home",
    [EditorPages.Low_Carbon]: "Low-Carbon Energy",
    [EditorPages.Solar]: "Solar"
  },

  "EnergyDirection": {
    [EnergyDirection.Consumer]: "Consumer",
    [EnergyDirection.Source]: "Source",
    [EnergyDirection.Both]: "Both"
  },

  "EnergyType": {
    [EnergyType.Electric]: "Electric",
    [EnergyType.Gas]: "Gas"
  },

  "EnergyUnits": {
    [EnergyUnits.WattHours]: "Watt hours",
    [EnergyUnits.Joules]: "Joules",
    [EnergyUnits.Calories]: "Calories"
  },

  "EnergyUnitsOptions": {
    [EnergyUnitsOptions.Electric_Units]: "Electric units",
    [EnergyUnitsOptions.Electric_Unit_Prefixes]: "Electric unit prefixes",
    [EnergyUnitsOptions.Display_Precision_Default]: "Display precision (100+)",
    [EnergyUnitsOptions.Display_Precision_Under_10]: "Display precision (<10)",
    [EnergyUnitsOptions.Display_Precision_Under_100]: "Display precision (<100)",
    [EnergyUnitsOptions.Gas_Calorific_Value]: "Gas calorific value",
    [EnergyUnitsOptions.Gas_Calorific_Value + HELPTEXT_SUFFIX]: "This can be found on your gas statement and can change from time to time",
    [EnergyUnitsOptions.Gas_Units]: "Gas units",
    [EnergyUnitsOptions.Gas_Unit_Prefixes]: "Gas unit prefixes",
    [EnergyUnitsOptions.Prefix_Threshold]: "Prefix threshold",
    [EnergyUnitsOptions.Unit_Position]: "Show units"
  },

  "EntitiesOptions": {
    [EntitiesOptions.Colours]: "Colors",
    [EntitiesOptions.Entities]: "Entities",
    [EntitiesOptions.Export_Entities]: "Export Entities",
    [EntitiesOptions.Import_Entities]: "Import Entities",
    [EntitiesOptions.Overrides]: "Overrides",
    [EntitiesOptions.Secondary_Info]: "Secondary Info"
  },

  "EntityOptions": {
    [EntityOptions.Entity_Id]: "",
    [EntityOptions.Entity_Ids]: ""
  },

  "FlowsOptions": {
    [FlowsOptions.Animation]: "Animation",
    [FlowsOptions.Inactive_Flows]: "Inactive flows",
    [FlowsOptions.Scale]: "Scale",
    [FlowsOptions.Use_Hourly_Stats]: "Use hourly statistics",
    [FlowsOptions.Use_Hourly_Stats + HELPTEXT_SUFFIX]: "Hourly statistics are more precise, but may take longer to calculate"
  },

  "GasSourcesMode": {
    [GasSourcesMode.Do_Not_Show]: "Do not show",
    [GasSourcesMode.Add_To_Total]: "Add to the total",
    [GasSourcesMode.Show_Separately]: "Show as separate total",
    [GasSourcesMode.Automatic]: "Automatic"
  },

  "GlobalOptions": {
    [GlobalOptions.Date_Range]: "Date range",
    [GlobalOptions.Date_Range_From]: "From",
    [GlobalOptions.Date_Range_To]: "To",
    [GlobalOptions.Display_Mode]: "Display mode",
    [GlobalOptions.Display_Mode + HELPTEXT_SUFFIX]: "History and Hybrid modes require an energy-date-selection card to be present in the View",
    [GlobalOptions.Options]: "Options",
    [GlobalOptions.Title]: "Title",
    [GlobalOptions.Use_HASS_Config]: "Use the Energy Dashboard configuration",
    [GlobalOptions.Use_HASS_Config + HELPTEXT_SUFFIX]: "If enabled, the entities defined for the Energy Dashboard will be displayed"
  },

  "GridOptions": {
    [GridOptions.Power_Outage]: "Power Outage"
  },

  "HomeOptions": {
    [HomeOptions.Gas_Sources]: "Show gas sources",
    [HomeOptions.Gas_Sources_Threshold]: "Threshold",
    [HomeOptions.Gas_Sources_Threshold + HELPTEXT_SUFFIX]: "If gas usage is below this, add it to the total; otherwise display it separately",
    [HomeOptions.Subtract_Consumers]: "Subtract consuming devices from totals"
  },

  "InactiveFlowsMode": {
    [InactiveFlowsMode.Normal]: "Normal colors",
    [InactiveFlowsMode.Dimmed]: "Dimmed colors",
    [InactiveFlowsMode.Greyed]: "Greyed-out"
  },

  "LowCarbonDisplayMode": {
    [LowCarbonDisplayMode.Energy]: "Energy",
    [LowCarbonDisplayMode.Percentage]: "Percentage",
    [LowCarbonDisplayMode.Both]: "Both"
  },

  "LowCarbonOptions": {
    [LowCarbonOptions.Low_Carbon_Mode]: "Display as"
  },

  "OverridesOptions": {
    [OverridesOptions.Icon]: "Icon",
    [OverridesOptions.Icon + HELPTEXT_SUFFIX]: "Overrides the built-in icon",
    [OverridesOptions.Name]: "Name",
    [OverridesOptions.Name + HELPTEXT_SUFFIX]: "Overrides the built-in name"
  },

  "PowerOutageOptions": {
    [PowerOutageOptions.Alert_Icon]: "Override icon",
    [PowerOutageOptions.Alert_State]: "State of alert",
    [PowerOutageOptions.Alert_State + HELPTEXT_SUFFIX]: "The entity state which indicates an outage"
  },

  "Scale": {
    [Scale.Linear]: "Linear",
    [Scale.Logarithmic]: "Logarithmic"
  },

  "SecondaryInfoOptions": {
    [SecondaryInfoOptions.Display_Precision]: "Override display precision",
    [SecondaryInfoOptions.Icon]: "Icon",
    [SecondaryInfoOptions.Units]: "Override units",
    [SecondaryInfoOptions.Unit_Position]: "Show units"
  },

  "UnitPosition": {
    [UnitPosition.After_Space]: "After value (with space)",
    [UnitPosition.Before_Space]: "Before value (with space)",
    [UnitPosition.After]: "After value",
    [UnitPosition.Before]: "Before value",
    [UnitPosition.Hidden]: "Hidden"
  },

  "UnitPrefixes": {
    [UnitPrefixes.Unified]: "Unified",
    [UnitPrefixes.Individual]: "Individual"
  },

  "VolumeUnits": {
    [VolumeUnits.Same_As_Electric]: "Same as electric",
    [VolumeUnits.Cubic_Feet]: "Cubic feet",
    [VolumeUnits.Cubic_Metres]: "Cubic meters",
    [VolumeUnits.CCF]: "CCF",
    [VolumeUnits.MCF]: "MCF",
    [VolumeUnits.Litres]: "Liters"
  }
};
