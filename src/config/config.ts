import { ColourMode, LowCarbonDisplayMode, UnitPosition, GasSourcesMode, EnergyType, EnergyDirection, EnergyUnits, UnitPrefixes, VolumeUnits, InactiveFlowsMode, Scale, DateRange, DateRangeDisplayMode, AnimationMode, DisplayMode } from "@/enums";
import { HomeAssistant } from 'custom-card-helpers';
import { AppearanceConfig, BatteryConfig, DeviceConfig, DeviceOptions, EnergyDistributionExtConfig, GasConfig, GridConfig, GridOptions, HomeConfig, HomeOptions, LowCarbonConfig, LowCarbonOptions, OverridesConfig, OverridesOptions, PowerOutageOptions, SecondaryInfoConfig, SecondaryInfoOptions, SolarConfig } from ".";
import { AppearanceOptions, ColourOptions, EditorPages, EnergyUnitsOptions, NodeOptions, EntitiesOptions, FlowsOptions, GlobalOptions } from "@/config";
import { localize } from "@/localize/localize";
import { getEnergyDataCollection } from "@/energy";
import { HassEntity } from "home-assistant-js-websocket";
import equal from 'fast-deep-equal';
import { EntityRegistryEntry } from "@/hass";
import { name } from '../../package.json';

//================================================================================================================================================================================//

export const DEFAULT_CONFIG: EnergyDistributionExtConfig = getDefaultConfig(0, undefined);
export const DEFAULT_HOME_CONFIG: HomeConfig = getDefaultHomeConfig();
export const DEFAULT_SECONDARY_INFO_CONFIG: SecondaryInfoConfig = getDefaultSecondaryInfoConfig();
export const DEFAULT_DEVICE_CONFIG: DeviceConfig = getDefaultDeviceConfig([], []);

//================================================================================================================================================================================//

export const BASIC_COLOUR_MODES: ColourMode[] = [ColourMode.Default, ColourMode.Custom];
export const BASIC_COLOUR_MODES_SINGLE: ColourMode[] = [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom];
export const BASIC_COLOUR_MODES_DUAL: ColourMode[] = [ColourMode.Automatic, ColourMode.Import, ColourMode.Export, ColourMode.Do_Not_Colour, ColourMode.Custom];

//================================================================================================================================================================================//

export function getConfigValue<T>(configs: any[] | any, path: string[] | string, validator: ((value: any) => boolean) | undefined = _ => true): T {
  if (!(configs instanceof Array)) {
    configs = [configs];
  }

  if (!(path instanceof Array)) {
    path = [path];
  }

  for (let c: number = 0; c < configs.length; c++) {
    let obj: any = configs[c];

    if (obj !== undefined) {
      for (let n: number = 0; n < path.length; n++) {
        const fragment: string = path[n];
        obj = obj[fragment];

        if (obj === undefined) {
          break;
        }
      }

      if (obj !== undefined && validator(obj)) {
        return obj;
      }
    }
  }

  return undefined as T;
}

//================================================================================================================================================================================//

export function getConfigObjects(configs: any[], path: string[] | string): any[] {
  return configs.map(config => getConfigValue(config, path));
}

//================================================================================================================================================================================//

export function getMinimalConfig(hass: HomeAssistant | undefined): EnergyDistributionExtConfig {
  return {
    type: 'custom:' + name,
    [GlobalOptions.Date_Range]: getEnergyDataCollection(hass) ? DateRange.From_Date_Picker : DateRange.Today,
    [GlobalOptions.Date_Range_Live]: false,
    [GlobalOptions.Date_Range_Display]: DateRangeDisplayMode.Do_Not_Show,
    [GlobalOptions.Mode]: DisplayMode.Energy,
    [GlobalOptions.Use_HASS_Config]: true
  };
}

//================================================================================================================================================================================//

function getDefaultConfig(numDevices: number, hass: HomeAssistant | undefined): EnergyDistributionExtConfig {
  return {
    ...getMinimalConfig(hass),
    [EditorPages.Appearance]: getDefaultAppearanceConfig(),
    [EditorPages.Battery]: getDefaultBatteryConfig(),
    [EditorPages.Gas]: getDefaultGasConfig(),
    [EditorPages.Grid]: getDefaultGridConfig(),
    [EditorPages.Home]: getDefaultHomeConfig(),
    [EditorPages.Low_Carbon]: getDefaultLowCarbonConfig(),
    [EditorPages.Solar]: getDefaultSolarConfig(),
    [EditorPages.Devices]: [...Array(numDevices).keys()].flatMap(_ => getDefaultDeviceConfig([0, 0, 0], [0, 0, 0]))
  };
}

//================================================================================================================================================================================//

export function removeConfigDefaults(config: EnergyDistributionExtConfig, hass: HomeAssistant): EnergyDistributionExtConfig {
  const defaultConfig: EnergyDistributionExtConfig = getDefaultConfig(config.devices?.length ?? 0, hass);
  const dateRange: DateRange = getConfigValue(config, GlobalOptions.Date_Range);
  const threshold: string = getConfigValue(config, [EditorPages.Appearance, AppearanceOptions.Energy_Units, EnergyUnitsOptions.Prefix_Threshold]);

  config = structuredClone(config);

  if (threshold !== undefined) {
    config[EditorPages.Appearance]![AppearanceOptions.Energy_Units]![EnergyUnitsOptions.Prefix_Threshold] = Number.parseInt(threshold);
  }

  removeDefaultsRecursively(config, defaultConfig);

  if (dateRange !== undefined) {
    config[GlobalOptions.Date_Range] = dateRange;
  }

  return config;
}

//================================================================================================================================================================================//

function removeDefaultsRecursively(config: any, defaultConfig: any): void {
  for (const key in defaultConfig) {
    if (key === "type") {
      continue;
    }

    const defaultNode: any = defaultConfig[key];
    const currentNode: any = config[key];

    if (currentNode === undefined ||
      (typeof currentNode === "object" && Object.keys(currentNode).length === 0) ||
      equal(currentNode, defaultNode)) {
      delete config[key];
    } else if (!(defaultNode instanceof Array) && typeof defaultNode === "object") {
      removeDefaultsRecursively(currentNode, defaultNode);

      if (typeof currentNode === "object" && Object.keys(currentNode).length === 0) {
        delete config[key];
      }
    }
  }
}

//================================================================================================================================================================================//

export function populateConfigDefaults(config: EnergyDistributionExtConfig, hass: HomeAssistant): EnergyDistributionExtConfig {
  const defaultConfig: EnergyDistributionExtConfig = getDefaultConfig(config.devices?.length ?? 0, hass);

  config = structuredClone(config);
  setDefaultsRecursively(config, defaultConfig);

  const threshold: number = getConfigValue(config, [EditorPages.Appearance, AppearanceOptions.Energy_Units, EnergyUnitsOptions.Prefix_Threshold]);

  if (threshold !== undefined) {
    config[EditorPages.Appearance]![AppearanceOptions.Energy_Units]![EnergyUnitsOptions.Prefix_Threshold] = threshold.toString();
  }

  return config;
}

//================================================================================================================================================================================//

function setDefaultsRecursively(config: any, defaultConfig: any): void {
  for (const key in defaultConfig) {
    const defaultNode: any = defaultConfig[key];
    const currentNode: any = config[key];

    if (currentNode === undefined) {
      config[key] = defaultNode;
    } else if (typeof defaultNode === "object") {
      setDefaultsRecursively(currentNode, defaultNode);
    }
  }
}

//================================================================================================================================================================================//

export function getDefaultAppearanceConfig(): AppearanceConfig {
  return {
    [GlobalOptions.Options]: {
      [AppearanceOptions.Show_Zero_States]: true,
      [AppearanceOptions.Clickable_Entities]: false,
      [AppearanceOptions.Segment_Gaps]: false,
      [AppearanceOptions.Use_HASS_Style]: true,
      [AppearanceOptions.Dashboard_Link]: undefined,
      [AppearanceOptions.Dashboard_Link_Label]: undefined
    },
    [AppearanceOptions.Energy_Units]: {
      [EnergyUnitsOptions.Electric_Units]: EnergyUnits.WattHours,
      [EnergyUnitsOptions.Electric_Unit_Prefixes]: UnitPrefixes.Unified,
      [EnergyUnitsOptions.Gas_Units]: VolumeUnits.Same_As_Electric,
      [EnergyUnitsOptions.Gas_Unit_Prefixes]: UnitPrefixes.Unified,
      [EnergyUnitsOptions.Unit_Position]: UnitPosition.After_Space,
      [EnergyUnitsOptions.Display_Precision_Under_10]: 2,
      [EnergyUnitsOptions.Display_Precision_Under_100]: 1,
      [EnergyUnitsOptions.Display_Precision_Default]: 0,
      [EnergyUnitsOptions.Prefix_Threshold]: 1000,
      [EnergyUnitsOptions.Gas_Calorific_Value]: 39
    },
    [AppearanceOptions.Flows]: {
      [FlowsOptions.Use_Hourly_Stats]: false,
      [FlowsOptions.Animation]: AnimationMode.System_Setting,
      [FlowsOptions.Inactive_Flows]: InactiveFlowsMode.Normal,
      [FlowsOptions.Scale]: Scale.Linear
    }
  };
}

//================================================================================================================================================================================//

export function getDefaultGridConfig(): GridConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Import,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Flow,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig(),
    [GridOptions.Power_Outage]: {
      [PowerOutageOptions.Alert_Icon]: undefined,
      [PowerOutageOptions.Alert_State]: undefined,
      [PowerOutageOptions.Entity_Id]: undefined
    }
  };
}

//================================================================================================================================================================================//

export function getDefaultBatteryConfig(): BatteryConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Export,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Flow,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultSolarConfig(): SolarConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultGasConfig(): GasConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultHomeConfig(): HomeConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Dynamic,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [GlobalOptions.Options]: {
      [HomeOptions.Gas_Sources]: GasSourcesMode.Do_Not_Show,
      [HomeOptions.Gas_Sources_Threshold]: 33
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultLowCarbonConfig(): LowCarbonConfig {
  return {
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: [],
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: [],
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Flow,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [GlobalOptions.Options]: {
      [LowCarbonOptions.Low_Carbon_Mode]: LowCarbonDisplayMode.Value
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultDeviceConfig(importColour: number[], exportColour: number[]): DeviceConfig {
  return {
    ...getDefaultEntitiesConfig(),
    [NodeOptions.Overrides]: getDefaultOverridesConfig(),
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: importColour,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: exportColour,
      [ColourOptions.Circle]: ColourMode.Automatic,
      [ColourOptions.Circle_Colour]: [],
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon_Colour]: [],
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Import_Colour]: [],
      [ColourOptions.Value_Export]: ColourMode.Flow,
      [ColourOptions.Value_Export_Colour]: [],
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary_Colour]: []
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig(),
    [DeviceOptions.Name]: localize("common.new_device"),
    [DeviceOptions.Icon]: "mdi:devices",
    [DeviceOptions.Energy_Type]: EnergyType.Electric,
    [DeviceOptions.Energy_Direction]: EnergyDirection.Consumer_Only,
    [DeviceOptions.Subtract_From_Home]: true
  };
}

//================================================================================================================================================================================//

function getDefaultEntitiesConfig(): object {
  return {
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Export_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    }
  };
}

//================================================================================================================================================================================//

function getDefaultOverridesConfig(): OverridesConfig {
  return {
    [OverridesOptions.Name]: undefined,
    [OverridesOptions.Icon]: ""
  };
}

//================================================================================================================================================================================//

function getDefaultSecondaryInfoConfig(): SecondaryInfoConfig {
  return {
    [SecondaryInfoOptions.Display_Precision]: undefined,
    [SecondaryInfoOptions.Entity_Id]: undefined,
    [SecondaryInfoOptions.Icon]: undefined,
    [SecondaryInfoOptions.Unit_Position]: UnitPosition.After_Space
  };
}

//================================================================================================================================================================================//

export function getCo2SignalEntity(hass: HomeAssistant): string {
  let co2SignalEntity: string | undefined;

  for (const entity of Object.values(hass["entities"])) {
    const entry: EntityRegistryEntry = entity as EntityRegistryEntry;

    if (entry.platform !== "co2signal") {
      continue;
    }

    const co2State: HassEntity = hass.states[entry.entity_id];

    if (co2State && co2State.attributes.unit_of_measurement === "%") {
      co2SignalEntity = co2State.entity_id;
      break;
    }
  }

  return co2SignalEntity || "";
}

//================================================================================================================================================================================//
