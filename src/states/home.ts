import { localize } from "@/localize/localize";
import { ColourOptions, EntitiesOptions, HomeConfig } from "@/config";
import { ColourMode } from "@/enums";
import { ValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_HOME_CONFIG, getConfigValue } from "@/config/config";

export class HomeState extends ValueState {
  state: {
    fromSolar: number;
    fromGrid: number;
    fromBattery: number;
  };

  colorIcon: ColourMode;

  public constructor(hass: HomeAssistant, config: HomeConfig) {
    super(
      hass,
      [config, DEFAULT_HOME_CONFIG],
      [],
      localize("EditorPages.home"),
      "mdi:home"
    );

    this.state = {
      fromSolar: 0,
      fromGrid: 0,
      fromBattery: 0
    };

    this.colorIcon = getConfigValue(config, [EntitiesOptions.Colours, ColourOptions.Icon]);
  }
}
