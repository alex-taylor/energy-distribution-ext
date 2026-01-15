import { isValidSecondaryEntity, SecondaryInfoConfig, SecondaryInfoOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_SECONDARY_INFO_CONFIG, getConfigValue } from "@/config/config";

export class SecondaryInfoState {
  public readonly entity: string | undefined;
  public readonly configEntity: string | undefined;
  public readonly icon: string | undefined;
  public readonly isPresent: boolean;

  config: SecondaryInfoConfig[];
  state: number;

  public constructor(hass: HomeAssistant, config: SecondaryInfoConfig) {
    this.config = [config, DEFAULT_SECONDARY_INFO_CONFIG];
    this.state = 0;
    this.configEntity = getConfigValue(config, SecondaryInfoOptions.Entity_Id);
    this.entity = isValidSecondaryEntity(hass, this.configEntity) ? this.configEntity : undefined;
    this.icon = getConfigValue([config, DEFAULT_SECONDARY_INFO_CONFIG], SecondaryInfoOptions.Icon);
    this.isPresent = this.entity !== undefined;
  }
}
