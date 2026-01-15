import { localize } from "@/localize/localize";
import { ColoursConfig, HomeConfig, NodeOptions } from "@/config";
import { Colours, State } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_HOME_CONFIG, getConfigObjects } from "@/config/config";
import { CssClass, EnergyDirection } from "@/enums";

export class HomeState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass = CssClass.Home;
  protected readonly defaultName: string = localize("EditorPages.home");
  protected readonly defaultIcon: string = "mdi:home";

  public constructor(hass: HomeAssistant, config: HomeConfig) {
    super(hass, [config, DEFAULT_HOME_CONFIG]);
    const coloursConfig: ColoursConfig[] = getConfigObjects([config, DEFAULT_HOME_CONFIG], NodeOptions.Colours);
    this.colours = new Colours(coloursConfig, EnergyDirection.Consumer);
  }
}
