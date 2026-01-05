import { ColourOptions, DualValueNodeConfig, EditorPages, EnergyFlowCardExtConfig, EntitiesOptions, HomeConfig, SingleValueNodeConfig } from "@/config";
import { ColourMode, CssClass, GasSourcesMode } from "@/enums";
import { Flows, States } from "@/states";
import { getGasSourcesMode } from ".";
import { getConfigValue } from "@/config/config";
import { DEFAULT_HOME_CONFIG } from "@/const";

export interface MinMax {
  min: number;
  max: number;
}

const COLOUR_MAPPINGS: Map<ColourMode, CssClass> = new Map(
  [
    [ColourMode.Solar, CssClass.Solar],
    [ColourMode.High_Carbon, CssClass.Grid_Import],
    [ColourMode.Low_Carbon, CssClass.Low_Carbon],
    [ColourMode.Battery, CssClass.Battery_Import],
    [ColourMode.Gas, CssClass.Gas]
  ]
);

const STYLE_PRIMARY_TEXT_COLOR: string = "var(--primary-text-color)";
const STYLE_ENERGY_BATTERY_IMPORT_COLOR: string = "var(--energy-battery-out-color)";
const STYLE_ENERGY_BATTERY_EXPORT_COLOR: string = "var(--energy-battery-in-color)";
const STYLE_ENERGY_GRID_IMPORT_COLOR: string = "var(--energy-grid-consumption-color)";
const STYLE_ENERGY_GRID_EXPORT_COLOR: string = "var(--energy-grid-return-color)";

const HOME_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value, ColourOptions.Secondary];
const SINGLE_NODE_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value, ColourOptions.Secondary];
const DUAL_NODE_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value_Import, ColourOptions.Value_Export, ColourOptions.Secondary];

//================================================================================================================================================================================//

export function getColSpacing(circleSize: number): MinMax {
  return { min: Math.round(circleSize / 10), max: Math.round(circleSize * 5 / 8) }
}

//================================================================================================================================================================================//

export function setLayout(style: CSSStyleDeclaration, circleSize: number): void {
  const colSpacing = getColSpacing(circleSize);
  const rowSpacing: number = Math.round(circleSize * 3 / 8);

  style.setProperty("--circle-size", circleSize + "px");
  style.setProperty("--row-spacing", rowSpacing + "px");
  style.setProperty("--col-spacing-max", colSpacing.max + "px");
  style.setProperty("--col-spacing-min", colSpacing.min + "px");
}

//================================================================================================================================================================================//

export function setHomeNodeStaticStyles(config: HomeConfig, style: CSSStyleDeclaration): void {
  HOME_UI_ELEMENTS.forEach(options => {
    const mode: ColourMode = getConfigValue([config, DEFAULT_HOME_CONFIG], [EntitiesOptions.Colours, options]);

    let colour: string;

    switch (mode) {
      case ColourMode.Do_Not_Colour:
        colour = STYLE_PRIMARY_TEXT_COLOR;
        break;

      case ColourMode.Custom:
        colour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, options.replace("mode", "colour")])) || STYLE_PRIMARY_TEXT_COLOR;
        break;

      default:
        colour = `var(--flow-${COLOUR_MAPPINGS.get(mode)}-color)`;
        break;
    }

    if (options === ColourOptions.Value) {
      style.setProperty(`--value-electric-home-color`, colour);
      style.setProperty(`--value-gas-home-color`, colour);
    } else {
      style.setProperty(`--${options.replace("_mode", "")}-home-color`, colour);
    }
  });
}

//================================================================================================================================================================================//

export function setHomeNodeDynamicStyles(config: EnergyFlowCardExtConfig, states: States, style: CSSStyleDeclaration): void {
  if (states.homeElectric <= 0) {
    style.setProperty("--circle-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--icon-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--value-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--secondary-home-color", STYLE_PRIMARY_TEXT_COLOR);
    return;
  }

  const flows: Flows = states.flows;

  const electricSources: {} = {
    battery: {
      value: flows.batteryToHome,
      colour: "var(--flow-import-battery-color)"
    },
    solar: {
      value: flows.solarToHome,
      colour: "var(--flow-solar-color)"
    },
    highCarbon: {
      value: flows.gridToHome * (100 - states.lowCarbonPercentage) / 100,
      colour: "var(--flow-import-grid-color)"
    },
    lowCarbon: {
      value: flows.gridToHome * states.lowCarbonPercentage / 100,
      colour: "var(--flow-non-fossil-color)"
    }

    // TODO: electric-producing devices
  };

  const electricLargestSource: string = Object.keys(electricSources).reduce((a, b) => electricSources[a].value > electricSources[b].value ? a : b);
  const electricLargestColour: string = electricSources[electricLargestSource].colour;

  const gasSources: {} = {
    gas: {
      value: states.gasImport,
      colour: "var(--flow-gas-color)"
    }

    // TODO: gas-producing devices
  };

  const gasSourcesMode: GasSourcesMode = getGasSourcesMode(config, states);
  const gasLargestSource: string = Object.keys(gasSources).reduce((a, b) => gasSources[a].value > gasSources[b].value ? a : b);
  const gasLargestColour: string = gasSources[gasLargestSource].colour;
  const homeLargestColour: string = gasSourcesMode === GasSourcesMode.Do_Not_Show || electricSources[electricLargestSource].value >= gasSources[gasLargestSource].value ? electricLargestColour : gasLargestColour;

  HOME_UI_ELEMENTS.forEach(options => {
    if (getConfigValue([config], [EditorPages.Home, EntitiesOptions.Colours, options]) === ColourMode.Largest_Value) {
      if (options === ColourOptions.Value) {
        if (gasSourcesMode === GasSourcesMode.Show_Separately) {
          style.setProperty(`--value-electric-home-color`, electricLargestColour);
          style.setProperty(`--value-gas-home-color`, gasLargestColour);
        } else {
          style.setProperty(`--value-electric-home-color`, homeLargestColour);
          style.setProperty(`--value-gas-home-color`, homeLargestColour);
        }
      } else {
        style.setProperty(`--${options.replace("_mode", "")}-home-color`, homeLargestColour);
      }
    }
  });
}

//================================================================================================================================================================================//

export function setSingleValueNodeStyles(config: SingleValueNodeConfig, fallbackConfig: SingleValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyColour: string = `var(--energy-${cssClass}-color)`;
  let flowColour: string;

  if (getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow]) === ColourMode.Custom) {
    flowColour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow_Colour])) || energyColour;
  } else {
    flowColour = energyColour;
  }

  style.setProperty(`--flow-${cssClass}-color`, flowColour);

  SINGLE_NODE_UI_ELEMENTS.forEach(options => {
    const mode: ColourMode = getConfigValue([config, fallbackConfig], [EntitiesOptions.Colours, options]);
    let colour: string;

    switch (mode) {
      case ColourMode.Flow:
        colour = flowColour;
        break;

      case ColourMode.Custom:
        colour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, options.replace("mode", "colour")])) || STYLE_PRIMARY_TEXT_COLOR;
        break;

      case ColourMode.Do_Not_Colour:
      default:
        colour = STYLE_PRIMARY_TEXT_COLOR;
        break;
    }

    style.setProperty(`--${options.replace("_mode", "")}-${cssClass}-color`, colour);
  });
}

//================================================================================================================================================================================//

export function setDualValueNodeStaticStyles(config: DualValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyImportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT_COLOR : STYLE_ENERGY_GRID_IMPORT_COLOR;
  const energyExportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT_COLOR : STYLE_ENERGY_GRID_EXPORT_COLOR;
  let flowImportColour: string;
  let flowExportColour: string;

  if (getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow_Import]) === ColourMode.Custom) {
    flowImportColour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow_Import_Colour])) || energyImportColour;
  } else {
    flowImportColour = energyImportColour;
  }

  style.setProperty(`--flow-import-${cssClass}-color`, flowImportColour);

  if (getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow_Export]) === ColourMode.Custom) {
    flowExportColour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, ColourOptions.Flow_Export_Colour])) || energyExportColour;
  } else {
    flowExportColour = energyExportColour;
  }

  style.setProperty(`--flow-export-${cssClass}-color`, flowExportColour);

  DUAL_NODE_UI_ELEMENTS.forEach(options => {
    const defaultColour: string = options === ColourOptions.Circle || options === ColourOptions.Value_Import ? flowImportColour : options === ColourOptions.Value_Export ? flowExportColour : STYLE_PRIMARY_TEXT_COLOR;
    const mode: ColourMode = getConfigValue([config], [EntitiesOptions.Colours, options]);
    let colour: string;

    switch (mode) {
      case ColourMode.Flow:
        colour = defaultColour;
        break;

      case ColourMode.Import:
        colour = flowImportColour;
        break;

      case ColourMode.Export:
        colour = flowExportColour;
        break;

      case ColourMode.Custom:
        colour = convertColourListToHex(getConfigValue([config], [EntitiesOptions.Colours, options.replace("mode", "colour")])) || defaultColour;
        break;

      case ColourMode.Do_Not_Colour:
      default:
        colour = STYLE_PRIMARY_TEXT_COLOR;
    }

    style.setProperty(`--${options.replace("_mode", "").replace("_", "-")}-${cssClass}-color`, colour);
  });
}

//================================================================================================================================================================================//

export function setDualValueNodeDynamicStyles(config: DualValueNodeConfig, cssClass: CssClass, exportState: number, importState: number, style: CSSStyleDeclaration): void {
  const importColour = `var(--flow-import-${cssClass}-color)`;
  const exportColour = `var(--flow-export-${cssClass}-color)`;

  DUAL_NODE_UI_ELEMENTS.forEach(options => {
    if (getConfigValue([config], [EntitiesOptions.Colours, options]) === ColourMode.Larger_Value) {
      style.setProperty(`--${options.replace("_mode", "")}-${cssClass}-color`, exportState > importState ? exportColour : importColour);
    }
  });
}

//================================================================================================================================================================================//

const convertColourListToHex = (colourList: number[] | undefined = []): string => {
  if (colourList.length !== 3) {
    return STYLE_PRIMARY_TEXT_COLOR;
  }

  return "#".concat(colourList.map(x => x.toString(16).padStart(2, "0")).join(""));
};

//================================================================================================================================================================================//
