import { ColourMode, LowCarbonDisplayMode, UnitPosition, GasSourcesMode, EnergyType, EnergyDirection, EnergyUnits, UnitPrefixes, VolumeUnits, InactiveFlowsMode, Scale, DateRange, DateRangeDisplayMode, PrefixThreshold, AnimationMode, DisplayMode } from "@/enums";
import { HomeAssistant } from 'custom-card-helpers';
import { AppearanceConfig, BatteryConfig, DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, GasConfig, GridConfig, HomeConfig, HomeOptions, LowCarbonConfig, LowCarbonOptions, SecondaryInfoConfig, SecondaryInfoOptions, SolarConfig } from ".";
import { CARD_NAME } from "@/const";
import { AppearanceOptions, ColourOptions, EditorPages, EnergyUnitsOptions, NodeOptions, EntitiesOptions, FlowsOptions, GlobalOptions } from "@/config";
import { localize } from "@/localize/localize";
import { getEnergyDataCollection } from "@/energy";
import { HassEntity } from "home-assistant-js-websocket";
import equal from 'fast-deep-equal';
import { EntityRegistryEntry } from "@/hass";

//================================================================================================================================================================================//

export const DEFAULT_CONFIG: EnergyFlowCardExtConfig = getDefaultConfig(0);
export const DEFAULT_GAS_CONFIG: GasConfig = getDefaultGasConfig()!;
export const DEFAULT_SOLAR_CONFIG: SolarConfig = getDefaultSolarConfig()!;
export const DEFAULT_LOW_CARBON_CONFIG: LowCarbonConfig = getDefaultLowCarbonConfig();
export const DEFAULT_HOME_CONFIG: HomeConfig = getDefaultHomeConfig();
export const DEFAULT_BATTERY_CONFIG: BatteryConfig = getDefaultBatteryConfig();
export const DEFAULT_GRID_CONFIG: GridConfig = getDefaultGridConfig();
export const DEFAULT_SECONDARY_INFO_CONFIG: SecondaryInfoConfig = getDefaultSecondaryInfoConfig();
export const DEFAULT_DEVICE_CONFIG: DeviceConfig = getDefaultDeviceConfig([], []);

//================================================================================================================================================================================//

export const BASIC_COLOUR_MODES: ColourMode[] = [ColourMode.Default, ColourMode.Custom];
export const BASIC_COLOUR_MODES_SINGLE: ColourMode[] = [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom];
export const BASIC_COLOUR_MODES_DUAL: ColourMode[] = [ColourMode.Larger_Value, ColourMode.Import, ColourMode.Export, ColourMode.Do_Not_Colour, ColourMode.Custom];

//================================================================================================================================================================================//

export function getConfigValue<T>(configs: any[] | any, path: string[] | string, validator: ((value: any) => boolean) | undefined = _ => true): T {
  if (!(configs instanceof Array)) {
    configs = [configs];
  }

  if (!(path instanceof Array)) {
    path = [path];
  }

  for (let c: number = 0; c < configs.length; c++) {
    let obj = configs[c];

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

export function getMinimalConfig(hass: HomeAssistant | undefined = undefined): EnergyFlowCardExtConfig {
  return {
    type: 'custom:' + CARD_NAME,
    [GlobalOptions.Date_Range]: getEnergyDataCollection(hass) ? DateRange.From_Date_Picker : DateRange.Today,
    [GlobalOptions.Date_Range_Live]: false,
    [GlobalOptions.Date_Range_Display]: DateRangeDisplayMode.Do_Not_Show,
    [GlobalOptions.Mode]: DisplayMode.Energy,
    [GlobalOptions.Use_HASS_Config]: true
  };
}

//================================================================================================================================================================================//

function getDefaultConfig(numDevices: number): EnergyFlowCardExtConfig {
  return {
    ...getMinimalConfig(undefined),
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

export function cleanupConfig(config: EnergyFlowCardExtConfig): EnergyFlowCardExtConfig {
  //pruneConfig(config);

  const defaultConfig: EnergyFlowCardExtConfig = getDefaultConfig(config.devices?.length ?? 0);

  config = { ...config };

  Object.keys(defaultConfig).forEach(key => {
    if (config[key] === undefined) {
      if (typeof defaultConfig[key] !== "object") {
        config[key] = defaultConfig[key];
      }
    } else {
      if (typeof config[key] === "object") {
        if (equal(config[key], defaultConfig[key])) {
          delete config[key];
        } else {
          setDefaultsRecursively(config[key], defaultConfig[key]);
          config[key] = defaultConfig[key];
        }
      }
    }
  });

  return config;
}

//================================================================================================================================================================================//

function pruneConfig(config: any): void {
  for (const key in config) {
    if (config[key] === undefined || config[key] === null) {
      delete config[key];
    } else if (config[key] instanceof Array) {
      const array: any[] = config[key];

      array.forEach((entry, index) => {
        if (!entry) {
          array.splice(index, 1);
        }
      });

      if (array.length === 0) {
        delete config[key];
      }
    } else if (typeof config[key] === "object") {
      pruneConfig(config[key]);

      if (Object.keys(config[key]).length === 0) {
        delete config[key];
      }
    }
  }
}

//================================================================================================================================================================================//

function setDefaultsRecursively(config: any, defaultConfig: any): void {
  for (const key in defaultConfig) {
    const currentNode: any = config[key];

    if (currentNode) {
      if (currentNode instanceof Array) {
        defaultConfig[key] = [...currentNode];
      } else {
        const defaultNode: any = defaultConfig[key];

        if (typeof defaultNode === "object") {
          for (const childKey in currentNode) {
            if (typeof currentNode[childKey] === "object") {
              setDefaultsRecursively(currentNode, defaultNode);
            } else {
              defaultNode[childKey] = currentNode[childKey];
            }
          }
        }
      }
    }
  }

  for (const key in config) {
    if (!defaultConfig[key]) {
      defaultConfig[key] = config[key];
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
      [AppearanceOptions.Use_HASS_Style]: true
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
      [EnergyUnitsOptions.Prefix_Threshold]: PrefixThreshold.Threshold_1000,
      [EnergyUnitsOptions.Gas_Calorific_Value]: 39,
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
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Export_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Circle]: ColourMode.Import,
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Export]: ColourMode.Flow,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultBatteryConfig(): BatteryConfig {
  return {
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Export_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Circle]: ColourMode.Export,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Export]: ColourMode.Flow,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultSolarConfig(): SolarConfig {
  return {
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultGasConfig(): GasConfig {
  return {
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultHomeConfig(): HomeConfig {
  return {
    [NodeOptions.Colours]: {
      [ColourOptions.Circle]: ColourMode.Dynamic,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [GlobalOptions.Options]: {
      [HomeOptions.Gas_Sources]: GasSourcesMode.Do_Not_Show,
      [HomeOptions.Gas_Sources_Threshold]: 33,
      [HomeOptions.Subtract_Consumers]: false
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultLowCarbonConfig(): LowCarbonConfig {
  return {
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Icon]: ColourMode.Flow,
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [GlobalOptions.Options]: {
      [LowCarbonOptions.Low_Carbon_Mode]: LowCarbonDisplayMode.Energy
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig()
  };
}

//================================================================================================================================================================================//

export function getDefaultDeviceConfig(importColour: number[], exportColour: number[]): DeviceConfig {
  return {
    [NodeOptions.Import_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Export_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Power_Entities]: {
      [EntitiesOptions.Entity_Ids]: []
    },
    [NodeOptions.Colours]: {
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Import_Colour]: importColour,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Flow_Export_Colour]: exportColour,
      [ColourOptions.Circle]: ColourMode.Flow,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour
    },
    [NodeOptions.Secondary_Info]: getDefaultSecondaryInfoConfig(),
    [DeviceOptions.Name]: localize("common.new_device"),
    [DeviceOptions.Icon]: "mdi:devices",
    [DeviceOptions.Energy_Type]: EnergyType.Electric,
    [DeviceOptions.Energy_Direction]: EnergyDirection.Consumer_Only
  };
}

//================================================================================================================================================================================//

function getDefaultSecondaryInfoConfig(): SecondaryInfoConfig {
  return {
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
