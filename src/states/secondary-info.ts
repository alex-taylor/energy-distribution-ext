import { EntityOptions, filterSecondaryEntity, SecondaryInfoConfig, SecondaryInfoOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { State } from ".";

export class SecondaryInfoState extends State {
  config?: SecondaryInfoConfig;
  state: number;
  units?: string;

  public constructor(hass: HomeAssistant, config: SecondaryInfoConfig | undefined) {
    super(hass,
      config,
      filterSecondaryEntity(hass, config?.[EntityOptions.Entity_Id]),
      config?.[SecondaryInfoOptions.Icon] || ""
    );

    this.config = config;
    this.state = 0;
  }
}
