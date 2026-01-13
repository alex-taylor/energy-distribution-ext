import { ColourOptions, DualValueColourConfig, DualValueNodeConfig, EntitiesOptions, EntityOptions, filterPrimaryEntities, NodeConfig, OverridesOptions, SingleValueColourConfig, SingleValueNodeConfig } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { BiDiState, State } from ".";
import { ELECTRIC_ENTITY_CLASSES } from "@/const";
import { SecondaryInfoState } from "./secondary-info";
import { getConfigValue } from "@/config/config";
import { convertColourListToHex, STYLE_PRIMARY_TEXT_COLOR } from "@/ui-helpers/styles";
import { ColourMode, EnergyDirection } from "@/enums";

export abstract class ValueState extends State {
  public name: string;
  public secondary: SecondaryInfoState;

  protected constructor(hass: HomeAssistant, config: NodeConfig[], importEntities: string[], defaultName: string, defaultIcon: string) {
    super(config, importEntities, defaultIcon);
    this.name = getConfigValue(config, [EntitiesOptions.Overrides, OverridesOptions.Name]) || defaultName;
    this.secondary = new SecondaryInfoState(hass, getConfigValue(config, EntitiesOptions.Secondary_Info));
  }
}

export abstract class SingleValueState extends ValueState {
  public state: {
    import: number;
    importVolume: number;
  };

  protected constructor(hass: HomeAssistant, config: SingleValueNodeConfig[], hassEntityIds: string[], defaultName: string, defaultIcon: string, deviceClasses: string[]) {
    super(
      hass,
      config,
      filterPrimaryEntities(hass, [...hassEntityIds, ...(getConfigValue(config, [EntitiesOptions.Entities, EntityOptions.Entity_Ids])) || []], deviceClasses),
      defaultName,
      defaultIcon
    );

    this.state = {
      import: 0,
      importVolume: 0
    };

    this.rawEntities.push(...(getConfigValue(config, [EntitiesOptions.Entities, EntityOptions.Entity_Ids])) || []);
    this.hassConfigPresent = hassEntityIds.length !== 0;
  }
}

export abstract class DualValueState extends ValueState {
  public exportEntities: string[]
  public firstExportEntity?: string;

  protected constructor(hass: HomeAssistant, config: DualValueNodeConfig[], hassImportEntityIds: string[], hassExportEntityIds: string[], defaultName: string, defaultIcon: string) {
    super(
      hass,
      config,
      // TODO: deviceClasses needs to be a parameter
      filterPrimaryEntities(hass, [...hassImportEntityIds, ...(getConfigValue(config, [EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids])) || []], ELECTRIC_ENTITY_CLASSES),
      defaultName,
      defaultIcon
    );

    const exportEntities: string[] = getConfigValue(config, [EntitiesOptions.Export_Entities, EntityOptions.Entity_Ids]) || [];

    this.rawEntities.push(...(getConfigValue(config, [EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids])) || []);
    this.rawEntities.push(...exportEntities);
    this.exportEntities = filterPrimaryEntities(hass, [...hassExportEntityIds, ...exportEntities], ELECTRIC_ENTITY_CLASSES);
    this.firstExportEntity = this.exportEntities.length !== 0 ? this.exportEntities[0] : undefined;
    this.isPresent = this.isPresent || this.exportEntities.length !== 0;
    this.hassConfigPresent = hassImportEntityIds.length !== 0 || hassExportEntityIds.length !== 0;
  }
}

class Colour {
  protected _getCustomColour(configs: DualValueColourConfig[], path: string): string {
    return convertColourListToHex(getConfigValue(configs, path)) || STYLE_PRIMARY_TEXT_COLOR;
  }
}

export class SimpleColour extends Colour {
  public get value(): string {
    return this._value;
  }
  private _value: string;

  public constructor(config: SingleValueColourConfig[] | DualValueColourConfig[], option: ColourOptions) {
    super();
    this._value = this._getCustomColour(config, option.replace("mode", "colour"));;
  }
}

export class StaticColour extends Colour {
  public get value(): string {
    return this._value;
  }
  private _value: string;

  public constructor(config: SingleValueColourConfig[] | DualValueColourConfig[], option: ColourOptions, flowOption: ColourOptions) {
    super();

    switch (getConfigValue(config, option)) {
      case ColourMode.Custom:
        this._value = this._getCustomColour(config, option.replace("mode", "colour"));
        break;

      case ColourMode.Flow:
        this._value = this._getCustomColour(config, flowOption);
        break;

      default:
        this._value = STYLE_PRIMARY_TEXT_COLOR;
        break;
    }
  }
}

export class DynamicColour extends Colour {
  public get value(): string {
    if (this._direction === EnergyDirection.Both && this._mode === ColourMode.Larger_Value) {
      return this._state.import >= this._state.export ? this._importColour : this._exportColour;
    }

    return this._value;
  }
  private _mode: ColourMode;
  private _value: string;

  private _state: BiDiState;
  private _direction: EnergyDirection;
  private _importColour: string;
  private _exportColour: string;

  public constructor(config: DualValueColourConfig[], state: BiDiState, option: ColourOptions, direction: EnergyDirection) {
    super();
    this._state = state;
    this._direction = direction;
    this._mode = getConfigValue(config, option);
    this._importColour = this._getCustomColour(config, ColourOptions.Flow_Import_Colour);
    this._exportColour = this._getCustomColour(config, ColourOptions.Flow_Export_Colour);
    this._value = this._getColourValue(this._mode, this._getCustomColour(config, option.replace("mode", "colour")));
  }

  private _getColourValue(mode: ColourMode, customColour: string): string {
    if (this._direction === EnergyDirection.Both) {
      switch (mode) {
        case ColourMode.Import:
          return this._importColour;

        case ColourMode.Export:
          return this._exportColour;

        case ColourMode.Custom:
          return customColour;
      }
    } else {
      switch (mode) {
        case ColourMode.Custom:
          return customColour;

        case ColourMode.Flow:
          return this._direction === EnergyDirection.Consumer ? this._exportColour : this._importColour;
      }
    }

    return STYLE_PRIMARY_TEXT_COLOR;
  }
}
