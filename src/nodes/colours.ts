import { BiDiState } from ".";
import { ColourOptions, ColoursConfig } from "@/config";
import { getConfigValue } from "@/config/config";
import { ColourMode, EnergyDirection } from "@/enums";

//================================================================================================================================================================================//

export const STYLE_PRIMARY_TEXT_COLOR: string = "var(--primary-text-color)";

const COLOUR_MAPPINGS: Map<ColourMode, string> = new Map(
  [
    [ColourMode.Solar, "solar"],
    [ColourMode.High_Carbon, "import-grid"],
    [ColourMode.Low_Carbon, "non-fossil"],
    [ColourMode.Battery, "import-battery"],
    [ColourMode.Gas, "gas"]
  ]
);

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

  //================================================================================================================================================================================//

  public constructor(config: ColoursConfig[], direction: EnergyDirection, state: BiDiState = { import: 0, export: 0 }, defaultImportColour: string | number[] = "", defaultExportColour: string | number[] = "") {
    this._config = config;
    this._direction = direction;
    this._state = state;

    if (typeof defaultImportColour === "string") {
      this._defaultImportColour = defaultImportColour;
    } else {
      this._defaultImportColour = this._convertColourListToHex(defaultImportColour);
    }

    if (typeof defaultExportColour === "string") {
      this._defaultExportColour = defaultExportColour;
    } else {
      this._defaultExportColour = this._convertColourListToHex(defaultExportColour);
    }

    this.importFlow = this._getColour(ColourOptions.Flow_Import);
    this.exportFlow = this._getColour(ColourOptions.Flow_Export);
  }

  //================================================================================================================================================================================//

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
      case ColourMode.Largest_Value:
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
            return this._direction === EnergyDirection.Consumer_Only ? this.exportFlow : this.importFlow;

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

  //================================================================================================================================================================================//

  private _convertColourListToHex(colourList: number[] | undefined = []): string {
    if (colourList.length !== 3) {
      return STYLE_PRIMARY_TEXT_COLOR;
    }

    return "#".concat(colourList.map(x => x.toString(16).padStart(2, "0")).join(""));
  }

  //================================================================================================================================================================================//

  private _getCustomColour(config: ColoursConfig[], path: string): string {
    return this._convertColourListToHex(getConfigValue(config, path)) || STYLE_PRIMARY_TEXT_COLOR;
  }

  //================================================================================================================================================================================//
}
