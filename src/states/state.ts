import { ColourOptions, ColoursConfig, NodeOptions, EntitiesOptions, OverridesOptions, isValidPrimaryEntity } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { SecondaryInfoState } from "./secondary-info";
import { getConfigValue } from "@/config/config";
import { COLOUR_MAPPINGS, convertColourListToHex, STYLE_PRIMARY_TEXT_COLOR } from "@/ui-helpers/styles";
import { ColourMode, DeviceClasses, EnergyDirection } from "@/enums";
import { BiDiState } from ".";

//================================================================================================================================================================================//

export abstract class State {
  public readonly isPresent: boolean;
  public readonly hassConfigPresent: boolean;
  public readonly importEntities: string[];
  public readonly exportEntities: string[];
  public readonly configEntities: string[];
  public readonly firstImportEntity: string | undefined;
  public readonly firstExportEntity: string | undefined;
  public readonly secondary: SecondaryInfoState;

  public get name(): string {
    return this._name || this.defaultName;
  }
  private _name?: string;

  public get icon(): string {
    return this._icon || this.defaultIcon;
  }
  private _icon?: string;

  protected abstract get defaultName(): string;
  protected abstract get defaultIcon(): string;

  protected constructor(hass: HomeAssistant, config: any[], deviceClasses: DeviceClasses[] = [], hassImportEntities: string[] = [], hassExportEntities: string[] = []) {
    const importEntities: string[] = getConfigValue(config, [NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]) || [];
    const exportEntities: string[] = getConfigValue(config, [NodeOptions.Export_Entities, EntitiesOptions.Entity_Ids]) || [];

    this.importEntities = this._filterPrimaryEntities(hass, [...hassImportEntities, ...importEntities], deviceClasses);
    this.exportEntities = this._filterPrimaryEntities(hass, [...hassExportEntities, ...exportEntities], deviceClasses);
    this.configEntities = [...importEntities, ...exportEntities];

    this._name = getConfigValue(config, [NodeOptions.Overrides, OverridesOptions.Name]);
    this._icon = getConfigValue(config, [NodeOptions.Overrides, OverridesOptions.Icon]);
    this.secondary = new SecondaryInfoState(hass, getConfigValue(config, NodeOptions.Secondary_Info));

    this.isPresent = this.importEntities.length !== 0 || this.exportEntities.length !== 0;
    this.hassConfigPresent = hassImportEntities.length !== 0 || hassExportEntities.length !== 0;
    this.firstImportEntity = this.importEntities.length !== 0 ? this.importEntities[0] : undefined;
    this.firstExportEntity = this.exportEntities.length !== 0 ? this.exportEntities[0] : undefined;
  }

  private _filterPrimaryEntities(hass: HomeAssistant, entityIds: string[], deviceClasses: DeviceClasses[]): string[] {
    return [...new Set(entityIds.filter(entityId => isValidPrimaryEntity(hass, entityId, deviceClasses)))];
  }
}

//================================================================================================================================================================================//

export class Colours {
  public readonly importFlow: string;
  public readonly exportFlow: string;

  public get circle(): string {
    return this._getColour(ColourOptions.Circle);
  }

  public get importValue(): string {
    return this._getColour(ColourOptions.Value_Import);
  }

  public get exportValue(): string {
    return this._getColour(ColourOptions.Value_Export);
  }

  public get icon(): string {
    return this._getColour(ColourOptions.Icon);
  }

  public get secondary(): string {
    return this._getColour(ColourOptions.Secondary);
  }

  private _config: ColoursConfig[];
  private _direction: EnergyDirection;
  private _state: BiDiState | undefined;
  private _defaultImportColour: string
  private _defaultExportColour: string

  public constructor(config: ColoursConfig[], direction: EnergyDirection, state: BiDiState | undefined = undefined, defaultImportColour: string = STYLE_PRIMARY_TEXT_COLOR, defaultExportColour: string = STYLE_PRIMARY_TEXT_COLOR) {
    this._config = config;
    this._direction = direction;
    this._state = state;
    this._defaultImportColour = defaultImportColour;
    this._defaultExportColour = defaultExportColour;
    this.importFlow = this._getColour(ColourOptions.Flow_Import);
    this.exportFlow = this._getColour(ColourOptions.Flow_Export);
  }

  private _getColour(option: ColourOptions): string {
    const mode: ColourMode = getConfigValue(this._config, option);

    switch (mode) {
      case ColourMode.Battery:
      case ColourMode.Gas:
      case ColourMode.High_Carbon:
      case ColourMode.Low_Carbon:
      case ColourMode.Solar:
        return `var(--flow-${COLOUR_MAPPINGS.get(mode)}-color)`;

      case ColourMode.Default:
        switch (option) {
          case ColourOptions.Flow_Import:
            return this._defaultImportColour;

          case ColourOptions.Flow_Export:
            return this._defaultExportColour;

          default:
            return STYLE_PRIMARY_TEXT_COLOR;
        }

      case ColourMode.Do_Not_Colour:
        return STYLE_PRIMARY_TEXT_COLOR;

      case ColourMode.Dynamic:
        return "";

      case ColourMode.Export:
        return this.exportFlow;

      case ColourMode.Flow:
        switch (option) {
          case ColourOptions.Circle:
          case ColourOptions.Icon:
          case ColourOptions.Secondary:
            return this._direction === EnergyDirection.Consumer ? this.exportFlow : this.importFlow;

          case ColourOptions.Value_Export:
            return this.exportFlow;

          case ColourOptions.Value_Import:
            return this.importFlow;

          default:
            return STYLE_PRIMARY_TEXT_COLOR;
        }

      case ColourMode.Import:
        return this.importFlow;

      case ColourMode.Larger_Value:
        return this._state!.import >= this._state!.export ? this.importFlow : this.exportFlow;

      case ColourMode.Custom:
      default:
        return this._getCustomColour(this._config, option.replace("mode", "colour"));
    }
  }

  private _getCustomColour(config: ColoursConfig[], path: string): string {
    return convertColourListToHex(getConfigValue(config, path)) || STYLE_PRIMARY_TEXT_COLOR;
  }
}

//================================================================================================================================================================================//
