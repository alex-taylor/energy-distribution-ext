import { BatteryConfig, ColoursConfig, NodeOptions } from "@/config";
import { Colours, State } from "./state";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { EnergySource } from "@/hass";
import { DEFAULT_BATTERY_CONFIG, getConfigObjects } from "@/config/config";
import { CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection } from "@/enums";
import { BiDiState } from ".";

export class BatteryState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass = CssClass.Battery;
  protected readonly defaultName: string = localize("EditorPages.battery");
  protected readonly defaultIcon: string = "mdi:battery-high";

  public constructor(hass: HomeAssistant, config: BatteryConfig, state: BiDiState = { import: 0, export: 0 }, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_BATTERY_CONFIG],
      ELECTRIC_ENTITY_CLASSES,
      BatteryState._getHassImportEntities(energySources),
      BatteryState._getHassExportEntities(energySources)
    );

    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_BATTERY_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Both, state, "var(--energy-battery-out-color)", "var(--energy-battery-in-color)");
  }

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_from).map(source => source.stat_energy_from!);
  }

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_to).map(source => source.stat_energy_to!);
  }
}
