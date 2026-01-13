import { ColourOptions, DeviceConfig, DeviceOptions, DualValueColourConfig, EntitiesOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { DualValueState, DynamicColour, SimpleColour, StaticColour } from "./state";
import { DEFAULT_DEVICE_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { EnergyDirection, EnergyType } from "@/enums";
import { BiDiState } from ".";

export class DeviceState extends DualValueState {
  public readonly colours: {
    importFlow: SimpleColour;
    exportFlow: SimpleColour;
    circle: DynamicColour;
    importValue: StaticColour;
    exportValue: StaticColour;
    icon: DynamicColour;
    secondary: DynamicColour;
  };

  public readonly state: BiDiState;
  public readonly type: EnergyType;
  public readonly direction: EnergyDirection;

  public constructor(hass: HomeAssistant, config: DeviceConfig) {
    super(
      hass,
      [config, DEFAULT_DEVICE_CONFIG],
      [],
      [],
      getConfigValue(config, DeviceOptions.Name),
      getConfigValue(config, DeviceOptions.Icon)
    );

    this.state = {
      import: 0,
      export: 0
    }

    const configs: DeviceConfig[] = [config, DEFAULT_DEVICE_CONFIG];
    this.type = getConfigValue(configs, DeviceOptions.Energy_Type);
    this.direction = getConfigValue(configs, DeviceOptions.Energy_Direction);

    const colourConfigs: DualValueColourConfig[] = getConfigObjects(configs, EntitiesOptions.Colours);

    this.colours = {
      importFlow: new SimpleColour(colourConfigs, ColourOptions.Flow_Import_Colour),
      exportFlow: new SimpleColour(colourConfigs, ColourOptions.Flow_Export_Colour),
      circle: new DynamicColour(colourConfigs, this.state, ColourOptions.Circle, this.direction),
      importValue: new StaticColour(colourConfigs, ColourOptions.Value_Import, ColourOptions.Flow_Import_Colour),
      exportValue: new StaticColour(colourConfigs, ColourOptions.Value_Export, ColourOptions.Flow_Export_Colour),
      icon: new DynamicColour(colourConfigs, this.state, ColourOptions.Icon, this.direction),
      secondary: new DynamicColour(colourConfigs, this.state, ColourOptions.Secondary, this.direction)
    };
  }
}
