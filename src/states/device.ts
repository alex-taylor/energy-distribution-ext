import { DeviceConfig, OverridesOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { SingleValueState } from "./state";
import { ELECTRIC_ENTITY_CLASSES } from "@/const";
import { DEFAULT_DEVICE_CONFIG, getConfigValue } from "@/config/config";

export class DeviceState extends SingleValueState {
  public constructor(hass: HomeAssistant, config: DeviceConfig) {
    super(
      hass,
      [config, DEFAULT_DEVICE_CONFIG],
      [],
      getConfigValue(config, OverridesOptions.Name),
      getConfigValue(config, OverridesOptions.Icon),
      ELECTRIC_ENTITY_CLASSES
    );
  }
}
