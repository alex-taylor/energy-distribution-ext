import { isValidSecondaryEntity, SecondaryInfoConfig, SecondaryInfoOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { DEFAULT_SECONDARY_INFO_CONFIG, getConfigValue } from "@/config/config";
import { DisplayMode } from "@/enums";

//================================================================================================================================================================================//

export class SecondaryInfo {
  public readonly entity: string | undefined;
  public readonly configEntity: string | undefined;
  public readonly icon: string | undefined;
  public readonly isPresent: boolean;
  public readonly config: SecondaryInfoConfig[];

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, mode: DisplayMode, config: SecondaryInfoConfig) {
    this.config = [config, DEFAULT_SECONDARY_INFO_CONFIG];
    this.configEntity = getConfigValue(config, SecondaryInfoOptions.Entity_Id);
    this.entity = isValidSecondaryEntity(hass, mode, this.configEntity) ? this.configEntity : undefined;
    this.icon = getConfigValue([config, DEFAULT_SECONDARY_INFO_CONFIG], SecondaryInfoOptions.Icon);
    this.isPresent = this.entity !== undefined;
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//
