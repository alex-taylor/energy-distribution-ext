import { BatteryConfig } from "@/config";
import { DualValueState } from "./state";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { EnergySource } from "@/hass";
import { DEFAULT_BATTERY_CONFIG } from "@/config/config";

export class BatteryState extends DualValueState {
  state: {
    import: number;
    export: number;
    fromSolar: number;
    fromGrid: number;
  };

  public constructor(hass: HomeAssistant, config: BatteryConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_BATTERY_CONFIG],
      BatteryState._getHassImportEntities(energySources),
      BatteryState._getHassExportEntities(energySources),
      localize("EditorPages.battery"),
      "mdi:battery-high"
    );

    this.state = {
      import: 0,
      export: 0,
      fromSolar: 0,
      fromGrid: 0
    };
  }

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_from).map(source => source.stat_energy_from!);
  }

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_to).map(source => source.stat_energy_to!);
  }
}
