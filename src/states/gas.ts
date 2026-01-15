import { ColoursConfig, GasConfig, NodeOptions } from "@/config";
import { Colours, State } from "./state";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { CssClass, EnergyDirection, GAS_ENTITY_CLASSES } from "@/enums";
import { EnergySource } from "@/hass";
import { DEFAULT_GAS_CONFIG, getConfigObjects } from "@/config/config";

export class GasState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass = CssClass.Gas;
  protected readonly defaultName: string = localize("EditorPages.gas");
  protected readonly defaultIcon: string = "mdi:fire";

  public constructor(hass: HomeAssistant, config: GasConfig, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_GAS_CONFIG],
      GAS_ENTITY_CLASSES,
      GasState._getHassEntities(energySources)
    );

    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_GAS_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Source, undefined, "var(--energy-gas-color)");
  }

  private static _getHassEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "gas").map(source => source.stat_energy_from!);
  }
}
