import { localize } from "@/localize/localize";
import { SolarConfig } from "@/config";
import { SingleValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { ELECTRIC_ENTITY_CLASSES } from "@/const";
import { EnergySource } from "@/hass";
import { DEFAULT_SOLAR_CONFIG } from "@/config/config";

export class SolarState extends SingleValueState {
  public constructor(hass: HomeAssistant, config: SolarConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_SOLAR_CONFIG],
      SolarState._getHassEntities(energySources),
      localize("EditorPages.solar"),
      "mdi:solar-power",
      ELECTRIC_ENTITY_CLASSES
    );
  }

  private static _getHassEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "solar").map(source => source.stat_energy_from!);
  }
}
