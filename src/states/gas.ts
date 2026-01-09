import { GasConfig } from "@/config";
import { SingleValueState } from "./state";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { GAS_ENTITY_CLASSES } from "@/const";
import { EnergySource } from "@/hass";
import { DEFAULT_GAS_CONFIG } from "@/config/config";

export class GasState extends SingleValueState {
  config: GasConfig;

  public constructor(hass: HomeAssistant, config: GasConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_GAS_CONFIG],
      GasState._getHassEntities(energySources),
      localize("EditorPages.gas"),
      "mdi:fire",
      GAS_ENTITY_CLASSES
    );

    this.config = config;
  }

  private static _getHassEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "gas").map(source => source.stat_energy_from!);
;
  }
}
