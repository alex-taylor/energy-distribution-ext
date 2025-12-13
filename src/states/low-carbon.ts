import { localize } from "@/localize/localize";
import { EntitiesOptions, GlobalOptions, LowCarbonConfig } from "@/config";
import { ValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { getCo2SignalEntity } from "@/config/config";
import { LowCarbonType } from "@/enums";

export class LowCarbonState extends ValueState {
  config?: LowCarbonConfig;

  public constructor(hass: HomeAssistant, config: LowCarbonConfig | undefined) {
    super(
      hass,
      config,
      [getCo2SignalEntity(hass)],
      localize("editor.low_carbon"),
      "mdi:leaf"
    );

    this.config = config;
    this.isPresent = this.isPresent && config?.[GlobalOptions.Options]?.[EntitiesOptions.Low_Carbon_Mode] !== LowCarbonType.Hidden;
  }
}
