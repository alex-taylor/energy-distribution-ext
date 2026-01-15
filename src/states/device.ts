import { DeviceConfig, DeviceOptions, ColoursConfig, NodeOptions, ColourOptions } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { State, Colours } from "./state";
import { DEFAULT_DEVICE_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection, EnergyType, GAS_ENTITY_CLASSES } from "@/enums";
import { BiDiState } from ".";
import { convertColourListToHex } from "@/ui-helpers/styles";

export class DeviceState extends State {
  public readonly colours: Colours;
  public readonly cssClass: CssClass;
  public readonly state: BiDiState;
  public readonly type: EnergyType;
  public readonly direction: EnergyDirection;

  protected get defaultName(): string {
    return this._defaultName;
  }
  private _defaultName: string;

  protected get defaultIcon(): string {
    return this._defaultIcon;
  }
  private _defaultIcon: string;

  public constructor(hass: HomeAssistant, config: DeviceConfig, index: number) {
    super(
      hass,
      [config, DEFAULT_DEVICE_CONFIG],
      getConfigValue([config, DEFAULT_DEVICE_CONFIG], DeviceOptions.Energy_Type) === EnergyType.Gas ? GAS_ENTITY_CLASSES : ELECTRIC_ENTITY_CLASSES
    );

    this.cssClass = `${CssClass.Device}-${index}` as CssClass;

    this.state = {
      import: 0,
      export: 0
    };

    const configs: DeviceConfig[] = [config, DEFAULT_DEVICE_CONFIG];
    this._defaultName = getConfigValue(config, DeviceOptions.Name);
    this._defaultIcon = getConfigValue(config, DeviceOptions.Icon);

    this.type = getConfigValue(configs, DeviceOptions.Energy_Type);
    this.direction = getConfigValue(configs, DeviceOptions.Energy_Direction);

    const coloursConfig: ColoursConfig[] = getConfigObjects(configs, NodeOptions.Colours);

    this.colours = new Colours(
      coloursConfig,
      this.direction,
      this.state,
      convertColourListToHex(getConfigValue(coloursConfig, ColourOptions.Flow_Import_Colour)),
      convertColourListToHex(getConfigValue(coloursConfig, ColourOptions.Flow_Export_Colour))
    );
  }
}
