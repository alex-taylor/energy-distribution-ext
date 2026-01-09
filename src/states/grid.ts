import { localize } from "@/localize/localize";
import { EntityOptions, GridConfig, GridOptions, PowerOutageConfig, PowerOutageOptions } from "@/config";
import { DualValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_GRID_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { EnergySource } from "@/hass";

export class GridState extends DualValueState {
  state: {
    import: number;
    export: number;
    highCarbon: number;
    fromBattery: number;
    fromSolar: number;
  };

  powerOutage: {
    isPresent: boolean;
    isOutage: boolean;
    icon: string;
    state: string;
    entity_id: string;
  };

  public constructor(hass: HomeAssistant, config: GridConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_GRID_CONFIG],
      GridState._getHassImportEntities(energySources),
      GridState._getHassExportEntities(energySources),
      localize("EditorPages.grid"),
      "mdi:transmission-tower"
    );

    this.state = {
      import: 0,
      export: 0,
      highCarbon: 0,
      fromBattery: 0,
      fromSolar: 0
    };

    const powerOutageConfig: PowerOutageConfig[] = getConfigObjects([config, DEFAULT_GRID_CONFIG], GridOptions.Power_Outage);

    this.powerOutage = {
      isPresent: getConfigValue(powerOutageConfig, EntityOptions.Entity_Id) !== undefined,
      isOutage: false,
      icon: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_Icon) || "mdi:transmission-tower-off",
      state: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_State),
      entity_id: getConfigValue(powerOutageConfig, EntityOptions.Entity_Id)
    };
  }

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_from).flatMap(source => source.flow_from!.map(from => from!.stat_energy_from!));
  }

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_to).flatMap(source => source.flow_to!.map(to => to!.stat_energy_to!));
  }
}
