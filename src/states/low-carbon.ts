import { localize } from "@/localize/localize";
import { ColoursConfig, LowCarbonConfig, NodeOptions } from "@/config";
import { Colours, State } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_LOW_CARBON_CONFIG, getCo2SignalEntity, getConfigObjects } from "@/config/config";
import { DeviceClasses, EnergyDirection } from "@/enums";

export class LowCarbonState extends State {
  public readonly colours: Colours;

  protected get defaultName(): string {
    return localize("common.low_carbon");
  }

  protected get defaultIcon(): string {
    return "mdi:leaf";
  }

  public constructor(hass: HomeAssistant, config: LowCarbonConfig) {
    super(hass, [config, DEFAULT_LOW_CARBON_CONFIG], [DeviceClasses.None], [getCo2SignalEntity(hass)]);
    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_LOW_CARBON_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Source, undefined, "var(--energy-non-fossil-color)");
  }
}
