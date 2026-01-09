import { localize } from "@/localize/localize";
import { LowCarbonConfig } from "@/config";
import { ValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_LOW_CARBON_CONFIG, getCo2SignalEntity } from "@/config/config";

export class LowCarbonState extends ValueState {
  public constructor(hass: HomeAssistant, config: LowCarbonConfig) {
    super(
      hass,
      [config, DEFAULT_LOW_CARBON_CONFIG],
      [getCo2SignalEntity(hass)],
      localize("common.low_carbon"),
      "mdi:leaf"
    );
  }
}
