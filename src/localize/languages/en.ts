import { AppearanceOptions, ColourOptions, DeviceOptions, EditorPages, EnergyUnitsOptions, NodeOptions, EntitiesOptions, FlowsOptions, GlobalOptions, GridOptions, HomeOptions, LowCarbonOptions, OverridesOptions, PowerOutageOptions, SecondaryInfoOptions } from "@/config";
import { AnimationMode, ColourMode, DateRangeDisplayMode, DisplayMode, EnergyDirection, EnergyType, EnergyUnits, GasSourcesMode, InactiveFlowsMode, LowCarbonDisplayMode, Scale, UnitPosition, UnitPrefixes, VolumeUnits } from "@/enums";
import { HELPTEXT_SUFFIX } from "@/const";

//================================================================================================================================================================================//

export default {
  "common": {
    "go_to_dashboard": "Go to the {title} dashboard",
    "idle": "Idle",
    "initialising": "Initializing...",
    "invalid_configuration": "Invalid configuration",
    "loading": "Loading data...",
    "low_carbon": "Low-carbon",
    "new_device": "New Device",
    "no_date_picker": "This display mode requires a Date Selector to be present in this View",
    "power_outage": "Power outage",
    "timed_out": "Timed out while loading data",
    "unavailable": "Unavailable",
    "unknown": "Unknown"
  },

  "editor": {
    "add_device": "Add Device",
    "from_date_picker": "Use Energy Dashboard Date Selector",
    "go_back": "Go Back",
    "invalid_primary_entity": "is not an energy sensor of type Total or Total_Increasing",
    "invalid_secondary_entity": "is not of type Total or Total_Increasing",
    "missing_entity": "Entity must be specified",
    "next": "Next",
    "previous": "Previous",
    "remove_device": "Remove Device"
  },

  "AnimationMode": {
    [AnimationMode.System_Setting]: "Use system setting",
    [AnimationMode.Enabled]: "Enabled",
    [AnimationMode.Disabled]: "Disabled"
  },

  "AppearanceOptions": {
    [AppearanceOptions.Clickable_Entities]: "Clickable entities",
    [AppearanceOptions.Dashboard_Link]: "Dashboard link",
    [AppearanceOptions.Dashboard_Link_Label]: "Dashboard link label",
    [AppearanceOptions.Energy_Units]: "Energy Units",
    [AppearanceOptions.Flows]: "Flows",
    [AppearanceOptions.Power_Units]: "Power Units",
    [AppearanceOptions.Segment_Gaps]: "Show gaps between circle segments",
    [AppearanceOptions.Show_Zero_States]: "Show zero states",
    [AppearanceOptions.Use_HASS_Style]: "Use HASS-style layout and colors"
  },

  "ColourMode": {
    [ColourMode.Do_Not_Colour]: "Do not color",
    [ColourMode.Flow]: "Same as flow",
    [ColourMode.Automatic]: "Automatic",
    [ColourMode.Import]: {
      [EditorPages.Battery]: "Discharge",
      [EditorPages.Devices]: "Producer",
      [EditorPages.Grid]: "Import"
    },
    [ColourMode.Export]: {
      [EditorPages.Battery]: "Charge",
      [EditorPages.Devices]: "Consumer",
      [EditorPages.Grid]: "Export"
    },
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
    [ColourOptions.Flow_Export]: {
      [EditorPages.Battery]: "Charge flow",
      [EditorPages.Devices]: "Consumer flow",
      [EditorPages.Grid]: "Export flow"
    },
    [ColourOptions.Flow_Export_Colour]: {
      [EditorPages.Battery]: "Charge color",
      [EditorPages.Devices]: "Consumer color",
      [EditorPages.Grid]: "Export color"
    },
    [ColourOptions.Flow_Import]: {
      [EditorPages.Battery]: "Discharge flow",
      [EditorPages.Devices]: "Producer flow",
      [EditorPages.Gas]: "Flow",
      [EditorPages.Grid]: "Import flow",
      [EditorPages.Low_Carbon]: "Flow",
      [EditorPages.Solar]: "Flow"
    },
    [ColourOptions.Flow_Import_Colour]: {
      [EditorPages.Battery]: "Discharge color",
      [EditorPages.Devices]: "Producer color",
      [EditorPages.Gas]: "Flow color",
      [EditorPages.Grid]: "Import color",
      [EditorPages.Low_Carbon]: "Flow color",
      [EditorPages.Solar]: "Flow color"
    },
    [ColourOptions.Icon]: "Icon",
    [ColourOptions.Icon_Colour]: "Icon color",
    [ColourOptions.Secondary]: "Secondary value",
    [ColourOptions.Secondary_Colour]: "Secondary value color",
    [ColourOptions.Value_Export]: {
      [EditorPages.Battery]: "Charge value",
      [EditorPages.Devices]: "Consumer value",
      [EditorPages.Grid]: "Export value",
      [EditorPages.Home]: "Value"
    },
    [ColourOptions.Value_Export_Colour]: {
      [EditorPages.Battery]: "Charge color",
      [EditorPages.Devices]: "Consumer color",
      [EditorPages.Grid]: "Export color",
      [EditorPages.Home]: "Value color"
    },
    [ColourOptions.Value_Import]: {
      [EditorPages.Battery]: "Discharge value",
      [EditorPages.Devices]: "Producer value",
      [EditorPages.Gas]: "Value",
      [EditorPages.Grid]: "Import value",
      [EditorPages.Low_Carbon]: "Value",
      [EditorPages.Solar]: "Value"
    },
    [ColourOptions.Value_Import_Colour]: {
      [EditorPages.Battery]: "Discharge color",
      [EditorPages.Devices]: "Producer color",
      [EditorPages.Gas]: "Value color",
      [EditorPages.Grid]: "Import color",
      [EditorPages.Low_Carbon]: "Value color",
      [EditorPages.Solar]: "Value color"
    }
  },

  "DateRangeDisplayMode": {
    [DateRangeDisplayMode.Do_Not_Show]: "Do not show",
    [DateRangeDisplayMode.Preset_Name]: "Preset name",
    [DateRangeDisplayMode.Dates]: "Dates",
    [DateRangeDisplayMode.Both]: "Preset name and dates"
  },

  "DeviceOptions": {
    [DeviceOptions.Energy_Direction]: "Direction",
    [DeviceOptions.Energy_Type]: "Type",
    [DeviceOptions.Icon]: "Icon",
    [DeviceOptions.Name]: "Name",
    [DeviceOptions.Subtract_From_Home]: "Subtract consumption from Home total"
  },

  "DisplayMode": {
    [DisplayMode.Energy]: "Energy",
    [DisplayMode.Power]: "Power"
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
    [EnergyDirection.Consumer_Only]: "Consumer",
    [EnergyDirection.Producer_Only]: "Producer",
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
    [EnergyUnitsOptions.Gas_Calorific_Value + HELPTEXT_SUFFIX]: "This can usually be found on your gas bill and can change from time to time",
    [EnergyUnitsOptions.Gas_Units]: "Gas units",
    [EnergyUnitsOptions.Gas_Unit_Prefixes]: "Gas unit prefixes",
    [EnergyUnitsOptions.Prefix_Threshold]: "Prefix threshold",
    [EnergyUnitsOptions.Unit_Position]: "Show units"
  },

  "EntitiesOptions": {
    [EntitiesOptions.Entity_Ids]: ""
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
    [GlobalOptions.Date_Range]: "Date range to show",
    [GlobalOptions.Date_Range_From]: "From",
    [GlobalOptions.Date_Range_To]: "To",
    [GlobalOptions.Date_Range_Live]: "Include live sensor data",
    [GlobalOptions.Date_Range_Live + HELPTEXT_SUFFIX]: "If the selected date range includes the current day, use the latest values from the entities",
    [GlobalOptions.Date_Range_Display]: "Show the date range on the card",
    [GlobalOptions.Mode]: "Mode",
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
    [HomeOptions.Gas_Sources_Threshold + HELPTEXT_SUFFIX]: "If gas usage is below this, add it to the total; otherwise display it separately"
  },

  "InactiveFlowsMode": {
    [InactiveFlowsMode.Normal]: "Normal colors",
    [InactiveFlowsMode.Dimmed]: "Dimmed colors",
    [InactiveFlowsMode.Greyed]: "Greyed-out"
  },

  "LowCarbonDisplayMode": {
    [LowCarbonDisplayMode.Value]: "Energy",
    [LowCarbonDisplayMode.Percentage]: "Percentage",
    [LowCarbonDisplayMode.Both]: "Both"
  },

  "LowCarbonOptions": {
    [LowCarbonOptions.Low_Carbon_Mode]: "Display as"
  },

  "NodeOptions": {
    [NodeOptions.Colours]: "Colors",
    [NodeOptions.Export_Entities]: {
      [EditorPages.Battery]: "Charge Entities",
      [EditorPages.Devices]: "Consumer Entities",
      [EditorPages.Grid]: "Export Entities"
    },
    [NodeOptions.Import_Entities]: {
      [EditorPages.Battery]: "Discharge Entities",
      [EditorPages.Devices]: "Producer Entities",
      [EditorPages.Gas]: "Entities",
      [EditorPages.Grid]: "Import Entities",
      [EditorPages.Solar]: "Entities"
    },
    [NodeOptions.Overrides]: "Overrides",
    [NodeOptions.Power_Entities]: "Entities",
    [NodeOptions.Secondary_Info]: "Secondary Info"
  },

  "OverridesOptions": {
    [OverridesOptions.Icon]: "Icon",
    [OverridesOptions.Icon + HELPTEXT_SUFFIX]: "Overrides the built-in icon",
    [OverridesOptions.Name]: "Name",
    [OverridesOptions.Name + HELPTEXT_SUFFIX]: "Overrides the built-in name"
  },

  "PowerOutageOptions": {
    [PowerOutageOptions.Entity_Id]: "Entity",
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
    [SecondaryInfoOptions.Display_Precision + HELPTEXT_SUFFIX]: "Not used if the entity is energy",
    [SecondaryInfoOptions.Entity_Id]: "Entity",
    [SecondaryInfoOptions.Icon]: "Icon",
    [SecondaryInfoOptions.Unit_Position]: "Show units",
    [SecondaryInfoOptions.Unit_Position + HELPTEXT_SUFFIX]: "Not used if the entity is energy"
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

//================================================================================================================================================================================//
