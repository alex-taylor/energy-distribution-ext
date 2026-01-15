import { localize } from "@/localize/localize";
import { ColoursConfig, GridConfig, GridOptions, NodeOptions, PowerOutageConfig, PowerOutageOptions } from "@/config";
import { Colours, State } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_GRID_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { EnergySource } from "@/hass";
import { CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection } from "@/enums";
import { BiDiState } from ".";

export class GridState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass = CssClass.Grid;
  protected readonly defaultName: string = localize("EditorPages.grid");
  protected readonly defaultIcon: string = "mdi:transmission-tower";

  powerOutage: {
    isPresent: boolean;
    isOutage: boolean;
    icon: string;
    state: string;
    entity_id: string;
  };

  public constructor(hass: HomeAssistant, config: GridConfig, state: BiDiState = { import: 0, export: 0 }, energySources: EnergySource[]) {
    super(
      hass,
      [config, DEFAULT_GRID_CONFIG],
      ELECTRIC_ENTITY_CLASSES,
      GridState._getHassImportEntities(energySources),
      GridState._getHassExportEntities(energySources)
    );

    const powerOutageConfig: PowerOutageConfig[] = getConfigObjects([config, DEFAULT_GRID_CONFIG], GridOptions.Power_Outage);

    this.powerOutage = {
      isPresent: getConfigValue(powerOutageConfig, PowerOutageOptions.Entity_Id) !== undefined,
      isOutage: false,
      icon: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_Icon) || "mdi:transmission-tower-off",
      state: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_State),
      entity_id: getConfigValue(powerOutageConfig, PowerOutageOptions.Entity_Id)
    };

    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_GRID_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Both, state, "var(--energy-grid-consumption-color)", "var(--energy-grid-return-color)");
  }

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_from).flatMap(source => source.flow_from!.map(from => from!.stat_energy_from!));
  }

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_to).flatMap(source => source.flow_to!.map(to => to!.stat_energy_to!));
  }
}
