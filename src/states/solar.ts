import { localize } from "@/localize/localize";
import { ColoursConfig, NodeOptions, SolarConfig } from "@/config";
import { Colours, State } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection } from "@/enums";
import { EnergySource } from "@/hass";
import { DEFAULT_SOLAR_CONFIG, getConfigObjects } from "@/config/config";

export class SolarState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass = CssClass.Solar;
  protected readonly defaultName: string = localize("EditorPages.solar");
  protected readonly defaultIcon: string = "mdi:solar-power";

  public constructor(hass: HomeAssistant, config: SolarConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_SOLAR_CONFIG],
      ELECTRIC_ENTITY_CLASSES,
      SolarState._getHassEntities(energySources)
    );

    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_SOLAR_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Source, undefined, "var(--energy-solar-color)");
}

  private static _getHassEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "solar").map(source => source.stat_energy_from!);
  }
}
