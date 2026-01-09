import { EntityOptions, filterSecondaryEntity, SecondaryInfoConfig, SecondaryInfoOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { State } from ".";
import { DEFAULT_SECONDARY_INFO_CONFIG, getConfigValue } from "@/config/config";

export class SecondaryInfoState extends State {
  config: SecondaryInfoConfig[];
  state: number;

  public constructor(hass: HomeAssistant, config: SecondaryInfoConfig) {
    super(
      [config, DEFAULT_SECONDARY_INFO_CONFIG],
      filterSecondaryEntity(hass, getConfigValue([config, DEFAULT_SECONDARY_INFO_CONFIG], EntityOptions.Entity_Id)),
      getConfigValue([config, DEFAULT_SECONDARY_INFO_CONFIG], SecondaryInfoOptions.Icon)
    );

    this.config = [config, DEFAULT_SECONDARY_INFO_CONFIG];
    this.state = 0;

    const entityId: string = getConfigValue(config, EntityOptions.Entity_Id);

    if (entityId) {
      this.rawEntities.push(entityId);
    }
  }
}
