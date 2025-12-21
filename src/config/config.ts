import { ColourMode, DisplayMode, DotsMode, LowCarbonType, InactiveFlowsMode, DefaultValues, UnitPrefixes, UnitPosition, GasSourcesMode, EnergyType, EnergyDirection } from "@/enums";
import { HomeAssistant } from 'custom-card-helpers';
import { AppearanceConfig, BatteryConfig, DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, GasConfig, GridConfig, HomeConfig, HomeOptions, LowCarbonConfig, SolarConfig } from ".";
import { CARD_NAME } from "@/const";
import { AppearanceOptions, ColourOptions, EditorPages, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions } from "@/config";
import { localize } from "@/localize/localize";
import { getEnergyDataCollection } from "@/energy";
import { HassEntity } from "home-assistant-js-websocket";
import equal from 'fast-deep-equal';
import { EnergyCollection, EnergySource, EntityRegistryEntry } from "@/hass";

//================================================================================================================================================================================//

export function getDefaultConfig(hass: HomeAssistant): EnergyFlowCardExtConfig {
  return {
    type: 'custom:' + CARD_NAME,
    [GlobalOptions.Display_Mode]: getEnergyDataCollection(hass) ? DisplayMode.History : DisplayMode.Today,
    [EditorPages.Appearance]: getDefaultAppearanceConfig(),
    [EditorPages.Battery]: getDefaultBatteryConfig(hass, true),
    [EditorPages.Gas]: getDefaultGasConfig(hass, true),
    [EditorPages.Grid]: getDefaultGridConfig(hass, true),
    [EditorPages.Home]: getDefaultHomeConfig(),
    [EditorPages.Low_Carbon]: getDefaultLowCarbonConfig(),
    [EditorPages.Solar]: getDefaultSolarConfig(hass, true)
  };
}

//================================================================================================================================================================================//

export function cleanupConfig(hass: HomeAssistant, config: EnergyFlowCardExtConfig): EnergyFlowCardExtConfig {
  //pruneConfig(config);
  config = updateConfig(config, EditorPages.Battery, getDefaultBatteryConfig(hass, false));
  config = updateConfig(config, EditorPages.Gas, getDefaultGasConfig(hass, false));
  config = updateConfig(config, EditorPages.Grid, getDefaultGridConfig(hass, false));
  config = updateConfig(config, EditorPages.Low_Carbon, getDefaultLowCarbonConfig());
  config = updateConfig(config, EditorPages.Solar, getDefaultSolarConfig(hass, false));
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

function updateConfig(config: EnergyFlowCardExtConfig, key: EditorPages, defaultConfig: any): EnergyFlowCardExtConfig {
  if (!config[key]) {
    return config;
  }

  if (equal(config[key], defaultConfig)) {
    config = { ...config };
    delete config[key];
    return config;
  }

  setDefaultsRecursively(config[key], defaultConfig);
  config = { ...config };
  config[key] = defaultConfig;
  return config;
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
      [AppearanceOptions.Segment_Gaps]: false
    },
    [AppearanceOptions.Energy_Units]: {
      [EnergyUnitsOptions.Unit_Prefixes]: UnitPrefixes.Unified,
      [EnergyUnitsOptions.Unit_Position]: UnitPosition.After_Space,
      [EnergyUnitsOptions.Display_Precision_Under_10]: DefaultValues.Display_Precision_Under_10,
      [EnergyUnitsOptions.Display_Precision_Under_100]: DefaultValues.Display_Precision_Under_100,
      [EnergyUnitsOptions.Display_Precision_Default]: DefaultValues.Display_Precision,
      [EnergyUnitsOptions.Wh_Kwh_Threshold]: DefaultValues.Whk_Wh_Threshold,
      [EnergyUnitsOptions.Kwh_Mwh_Threshold]: DefaultValues.Kwh_Mwh_Threshold
    },
    [AppearanceOptions.Flows]: {
      [FlowsOptions.Use_Hourly_Stats]: false,
      [FlowsOptions.Use_HASS_Style]: true,
      [FlowsOptions.Animation]: DotsMode.HASS,
      [FlowsOptions.Inactive_Flows]: InactiveFlowsMode.Normal,
      [FlowsOptions.Min_Rate]: DefaultValues.Min_Flow_Rate,
      [FlowsOptions.Max_Rate]: DefaultValues.Max_Flow_Rate,
      [FlowsOptions.Min_Energy]: DefaultValues.Min_Flow_Energy,
      [FlowsOptions.Max_Energy]: DefaultValues.Max_Flow_Energy
    }
  };
}

//================================================================================================================================================================================//

export function getDefaultGridConfig(hass: HomeAssistant, requireEntity: boolean): GridConfig | undefined {
  const config: GridConfig = {
    [EntitiesOptions.Import_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Export_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Colours]: {
      [ColourOptions.Circle]: ColourMode.Import,
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Export]: ColourMode.Flow
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    }
  };

  if (!requireEntity) {
    return config;
  }

  const energyDataCollection: EnergyCollection | undefined = getEnergyDataCollection(hass);

  if (!energyDataCollection) {
    return undefined;
  }

  const sources: EnergySource[] | undefined = energyDataCollection?.prefs?.energy_sources;
  const energySourcesImport: string[] = sources?.filter(source => source.type === "grid" && source.flow_from).flatMap(source => source.flow_from!.map(from => from!.stat_energy_from!)) || [];
  const energySourcesExport: string[] = sources?.filter(source => source.type === "grid" && source.flow_to).flatMap(source => source.flow_to!.map(to => to!.stat_energy_to!)) || [];

  if (energySourcesImport.length === 0 && energySourcesExport.length === 0) {
    return undefined;
  }

  if (energySourcesImport.length !== 0) {
    config[EntitiesOptions.Import_Entities] = {
      [EntityOptions.Entity_Ids]: energySourcesImport
    };
  }

  if (energySourcesExport.length !== 0) {
    config[EntitiesOptions.Export_Entities] = {
      [EntityOptions.Entity_Ids]: energySourcesExport
    };
  }

  return config;
}

//================================================================================================================================================================================//

export function getDefaultBatteryConfig(hass: HomeAssistant, requireEntity: boolean): BatteryConfig | undefined {
  const config: BatteryConfig = {
    [EntitiesOptions.Import_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Export_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Colours]: {
      [ColourOptions.Circle]: ColourMode.Export,
      [ColourOptions.Flow_Import]: ColourMode.Default,
      [ColourOptions.Flow_Export]: ColourMode.Default,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Flow,
      [ColourOptions.Value_Export]: ColourMode.Flow
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    }
  };

  if (!requireEntity) {
    return config;
  }

  const energyDataCollection: EnergyCollection | undefined = getEnergyDataCollection(hass);

  if (!energyDataCollection) {
    return undefined;
  }

  const sources: EnergySource[] | undefined = energyDataCollection?.prefs?.energy_sources;
  const energySourcesImport: string[] = sources?.filter(source => source.type === "battery").filter(source => source.stat_energy_from).map(source => source.stat_energy_from!) || [];
  const energySourcesExport: string[] = sources?.filter(source => source.type === "battery").filter(source => source.stat_energy_to).map(source => source.stat_energy_to!) || [];

  if (energySourcesImport.length === 0 && energySourcesExport.length === 0) {
    return undefined;
  }

  if (energySourcesImport.length !== 0) {
    config[EntitiesOptions.Import_Entities] = {
      [EntityOptions.Entity_Ids]: energySourcesImport
    };
  }

  if (energySourcesExport.length !== 0) {
    config[EntitiesOptions.Export_Entities] = {
      [EntityOptions.Entity_Ids]: energySourcesExport
    };
  }

  return config;
}

//================================================================================================================================================================================//

export function getDefaultSolarConfig(hass: HomeAssistant, requireEntity: boolean): SolarConfig | undefined {
  const config: SolarConfig = {
    [EntitiesOptions.Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Colours]: {
      [ColourOptions.Flow]: ColourMode.Default,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value]: ColourMode.Do_Not_Colour
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    }
  };

  if (!requireEntity) {
    return config;
  }

  const energyDataCollection: EnergyCollection | undefined = getEnergyDataCollection(hass);

  if (!energyDataCollection) {
    return undefined;
  }

  const sources: EnergySource[] | undefined = energyDataCollection?.prefs?.energy_sources;
  const energySources: string[] = sources?.filter(source => source.type === "solar").map(source => source.stat_energy_from!) || [];

  if (energySources.length !== 0) {
    config[EntitiesOptions.Entities] = {
      [EntityOptions.Entity_Ids]: energySources
    };

    return config;
  }

  return undefined;
}

//================================================================================================================================================================================//

export function getDefaultGasConfig(hass: HomeAssistant, requireEntity: boolean): GasConfig | undefined {
  const config: GasConfig = {
    [EntitiesOptions.Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Colours]: {
      [ColourOptions.Flow]: ColourMode.Default,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value]: ColourMode.Do_Not_Colour
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    }
  };

  if (!requireEntity) {
    return config;
  }

  const energyDataCollection: EnergyCollection | undefined = getEnergyDataCollection(hass);

  if (!energyDataCollection) {
    return undefined;
  }

  const sources: EnergySource[] | undefined = energyDataCollection?.prefs?.energy_sources;
  const energySources: string[] = sources?.filter(source => source.type === "gas").map(source => source.stat_energy_from!) || [];

  if (energySources.length !== 0) {
    config[EntitiesOptions.Entities] = {
      [EntityOptions.Entity_Ids]: energySources
    };

    return config;
  }

  return undefined;
}

//================================================================================================================================================================================//

export function getDefaultHomeConfig(): HomeConfig {
  return {
    [EntitiesOptions.Colours]: {
      [ColourOptions.Circle]: ColourMode.Dynamic,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value]: ColourMode.Do_Not_Colour
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    },
    [GlobalOptions.Options]: {
      [HomeOptions.Gas_Sources]: GasSourcesMode.Do_Not_Show,
      [HomeOptions.Gas_Sources_Threshold]: DefaultValues.Gas_Sources_Threshold,
      [HomeOptions.Subtract_Consumers]: false
    }
  };
}

//================================================================================================================================================================================//

export function getDefaultLowCarbonConfig(): LowCarbonConfig {
  return {
    [EntitiesOptions.Colours]: {
      [ColourOptions.Flow]: ColourMode.Default,
      [ColourOptions.Icon]: ColourMode.Flow,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value]: ColourMode.Do_Not_Colour
    },
    [GlobalOptions.Options]: {
      [EntitiesOptions.Low_Carbon_Mode]: LowCarbonType.Energy
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    }
  };
}

//================================================================================================================================================================================//

export function getDefaultDeviceConfig(importColour: number[], exportColour: number[]): DeviceConfig {
  return {
    [EntitiesOptions.Import_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Export_Entities]: {
      [EntityOptions.Entity_Ids]: []
    },
    [EntitiesOptions.Colours]: {
      [ColourOptions.Flow_Import_Colour]: importColour,
      [ColourOptions.Flow_Export_Colour]: exportColour,
      [ColourOptions.Circle]: ColourMode.Do_Not_Colour,
      [ColourOptions.Icon]: ColourMode.Do_Not_Colour,
      [ColourOptions.Secondary]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Import]: ColourMode.Do_Not_Colour,
      [ColourOptions.Value_Export]: ColourMode.Do_Not_Colour
    },
    [EntitiesOptions.Secondary_Info]: {
      [EntityOptions.Unit_Position]: UnitPosition.After_Space
    },
    [DeviceOptions.Name]: localize("common.new_device"),
    [DeviceOptions.Icon]: "mdi:devices",
    [DeviceOptions.Energy_Type]: EnergyType.Electric,
    [DeviceOptions.Energy_Direction]: EnergyDirection.Consumer
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

  return co2SignalEntity ?? "";
}

//================================================================================================================================================================================//
