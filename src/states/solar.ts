import { localize } from "@/localize/localize";
import { SolarConfig } from "@/config";
import { SingleValueState } from "./state";
import { HomeAssistant } from "custom-card-helpers";

export class SolarState extends SingleValueState {
  config?: SolarConfig;

  public constructor(hass: HomeAssistant, config: SolarConfig | undefined) {
    super(
      hass,
      config,
      localize("editor.solar"),
      "mdi:solar-power"
    );

    this.config = config;
  }
}
