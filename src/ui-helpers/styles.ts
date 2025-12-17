import { ColourOptions, DualValueNodeConfig, EntitiesOptions, HomeConfig, SingleValueNodeConfig } from "@/config";
import { STYLE_ENERGY_BATTERY_EXPORT_COLOR, STYLE_ENERGY_BATTERY_IMPORT_COLOR, STYLE_ENERGY_GAS_COLOR, STYLE_ENERGY_GRID_EXPORT_COLOR, STYLE_ENERGY_GRID_IMPORT_COLOR, STYLE_ENERGY_NON_FOSSIL_COLOR, STYLE_ENERGY_SOLAR_COLOR, STYLE_PRIMARY_TEXT_COLOR, STYLE_DISABLED_TEXT_COLOR } from "@/const";
import { ColourMode, CssClass } from "@/enums";
import { Flows, States } from "@/states";

//================================================================================================================================================================================//

export function setHomeNodeStaticStyles(config: HomeConfig, style: CSSStyleDeclaration): void {
  const customColour: string = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Custom_Colour]);
  let circleColour;
  let iconColour;
  let textColour;

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]) {
    case ColourMode.Solar:
      circleColour = STYLE_ENERGY_SOLAR_COLOR;
      break;

    case ColourMode.High_Carbon:
      circleColour = STYLE_ENERGY_GRID_IMPORT_COLOR;
      break;

    case ColourMode.Low_Carbon:
      circleColour = STYLE_ENERGY_NON_FOSSIL_COLOR;
      break;

    case ColourMode.Battery:
      circleColour = STYLE_ENERGY_BATTERY_IMPORT_COLOR;
      break;

    case ColourMode.Gas:
      circleColour = STYLE_ENERGY_GAS_COLOR;
      break;

    case ColourMode.Custom:
      circleColour = customColour;
      break;

    default:
      circleColour = STYLE_DISABLED_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon]) {
    case ColourMode.Solar:
      iconColour = STYLE_ENERGY_SOLAR_COLOR;
      break;

    case ColourMode.High_Carbon:
      iconColour = STYLE_ENERGY_GRID_IMPORT_COLOR;
      break;

    case ColourMode.Low_Carbon:
      iconColour = STYLE_ENERGY_NON_FOSSIL_COLOR;
      break;

    case ColourMode.Battery:
      iconColour = STYLE_ENERGY_BATTERY_IMPORT_COLOR;
      break;

    case ColourMode.Gas:
      iconColour = STYLE_ENERGY_GAS_COLOR;
      break;

    case ColourMode.Custom:
      iconColour = customColour;
      break;

    default:
      iconColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Value]) {
    case ColourMode.Solar:
      textColour = STYLE_ENERGY_SOLAR_COLOR;
      break;

    case ColourMode.High_Carbon:
      textColour = STYLE_ENERGY_GRID_IMPORT_COLOR;
      break;

    case ColourMode.Low_Carbon:
      textColour = STYLE_ENERGY_NON_FOSSIL_COLOR;
      break;

    case ColourMode.Battery:
      textColour = STYLE_ENERGY_BATTERY_IMPORT_COLOR;
      break;

    case ColourMode.Gas:
      textColour = STYLE_ENERGY_GAS_COLOR;
      break;

    case ColourMode.Custom:
      textColour = customColour;
      break;

    default:
      textColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  style.setProperty("--circle-home-solar-color", circleColour);
  style.setProperty("--circle-home-battery-color", circleColour);
  style.setProperty("--circle-home-non-fossil-color", circleColour);
  style.setProperty("--circle-home-grid-color", circleColour);
  style.setProperty("--icon-home-color", iconColour);
  style.setProperty("--text-home-color", textColour);
}

//================================================================================================================================================================================//

export function setHomeNodeDynamicStyles(config: HomeConfig, states: States, style: CSSStyleDeclaration): void {
  if (states.home <= 0) {
    style.setProperty("--icon-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--text-home-color", STYLE_PRIMARY_TEXT_COLOR);
  } else {
    const flows: Flows = states.flows;

    const homeSources = {
      battery: {
        value: flows.batteryToHome,
        colour: STYLE_ENERGY_BATTERY_IMPORT_COLOR
      },
      solar: {
        value: flows.solarToHome,
        colour: STYLE_ENERGY_SOLAR_COLOR
      },
      highCarbon: {
        value: flows.gridToHome * (100 - states.lowCarbonPercentage) / 100,
        colour: STYLE_ENERGY_GRID_IMPORT_COLOR
      },
      lowCarbon: {
        value: flows.gridToHome * states.lowCarbonPercentage / 100,
        colour: STYLE_ENERGY_NON_FOSSIL_COLOR
      }
    };

    const homeLargestSource: string = Object.keys(homeSources).reduce((a, b) => homeSources[a].value > homeSources[b].value ? a : b);

    switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]) {
      case ColourMode.Dynamic:
        style.setProperty("--circle-home-solar-color", STYLE_ENERGY_SOLAR_COLOR);
        style.setProperty("--circle-home-battery-color", STYLE_ENERGY_BATTERY_IMPORT_COLOR);
        style.setProperty("--circle-home-non-fossil-color", STYLE_ENERGY_NON_FOSSIL_COLOR);
        style.setProperty("--circle-home-grid-color", STYLE_ENERGY_GRID_IMPORT_COLOR);
        break;

      case ColourMode.Largest_Value:
        style.setProperty("--circle-home-solar-color", homeSources[homeLargestSource].colour);
        style.setProperty("--circle-home-battery-color", homeSources[homeLargestSource].colour);
        style.setProperty("--circle-home-non-fossil-color", homeSources[homeLargestSource].colour);
        style.setProperty("--circle-home-grid-color", homeSources[homeLargestSource].colour);
        break;
    }

    if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon] === ColourMode.Largest_Value) {
      style.setProperty("--icon-home-color", homeSources[homeLargestSource].colour);
    }

    if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Value] === ColourMode.Largest_Value) {
      style.setProperty("--text-home-color", homeSources[homeLargestSource].colour);
    }
  }
}

//================================================================================================================================================================================//

export function setSingleValueNodeStyles(config: SingleValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyColour: string = `var(--energy-${cssClass}-color)`;
  const customColour: string = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Custom_Colour]);
  const circleColour: string = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Custom && customColour ? customColour : energyColour;
  let textColour: string;
  let iconColour: string;

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Value]) {
    case ColourMode.Default:
      textColour = energyColour;
      break;

    case ColourMode.Circle:
      textColour = circleColour;
      break;

    case ColourMode.Custom:
      textColour = customColour;
      break;

    default:
      textColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon]) {
    case ColourMode.Default:
      iconColour = energyColour;
      break;

    case ColourMode.Circle:
      iconColour = circleColour;
      break;

    case ColourMode.Custom:
      iconColour = customColour;
      break;

    default:
      iconColour = cssClass === CssClass.LowCarbon ? STYLE_ENERGY_NON_FOSSIL_COLOR : STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  style.setProperty(`--text-${cssClass}-color`, textColour);
  style.setProperty(`--icon-${cssClass}-color`, iconColour);
  style.setProperty(`--circle-${cssClass}-color`, circleColour);
}

//================================================================================================================================================================================//

export function setDualValueNodeStaticStyles(config: DualValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyImportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT_COLOR : STYLE_ENERGY_GRID_IMPORT_COLOR;
  const energyExportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT_COLOR : STYLE_ENERGY_GRID_EXPORT_COLOR;
  const customImportColour: string = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Colour]);
  const customExportColour: string = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Export_Colour]);
  let circleColour: string;
  let textImportColour: string;
  let textExportColour: string;
  let iconColour: string;

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]) {
    case ColourMode.Import:
      circleColour = energyImportColour;
      break;

    case ColourMode.Export:
      circleColour = energyExportColour;
      break;

    default:
      circleColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Values]) {
    case ColourMode.Custom:
      textImportColour = customImportColour;
      textExportColour = customExportColour;
      break;

    default:
      textImportColour = energyImportColour;
      textExportColour = energyExportColour;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon]) {
    case ColourMode.Import:
      iconColour = energyImportColour;
      break;

    case ColourMode.Export:
      iconColour = energyExportColour;
      break;

    default:
      iconColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  style.setProperty(`--text-${cssClass}-import-color`, textImportColour);
  style.setProperty(`--text-${cssClass}-export-color`, textExportColour);
  style.setProperty(`--icon-${cssClass}-color`, iconColour);
  style.setProperty(`--circle-${cssClass}-color`, circleColour);
}

//================================================================================================================================================================================//

export function setDualValueNodeDynamicStyles(config: DualValueNodeConfig, cssClass: CssClass, exportState: number, importState: number, style: CSSStyleDeclaration): void {
  const importColour = defaultImportColour(cssClass);
  const exportColour = defaultExportColour(cssClass);
  let circleColour: string;

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]) {
    case ColourMode.Larger_Value:
      if (exportState > importState) {
        circleColour = exportColour;
      } else {
        circleColour = importColour;
      }

      style.setProperty(`--circle-${cssClass}-color`, circleColour);
      break;

    case ColourMode.Custom:
      if (exportState > importState) {
        circleColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Export_Colour]);
      } else {
        circleColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Colour]);
      }

      style.setProperty(`--circle-${cssClass}-color`, circleColour);
      break;
  }

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Values] === ColourMode.Default) {
    style.setProperty(`--text-${cssClass}-import-color`, importColour);
    style.setProperty(`--text-${cssClass}-export-color`, exportColour);
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon]) {
    case ColourMode.Larger_Value:
      let iconColour: string;

      if (exportState > importState) {
        iconColour = exportColour;
      } else {
        iconColour = importColour;
      }

      style.setProperty(`--icon-${cssClass}-color`, iconColour);
      break;

    case ColourMode.Custom:
      style.setProperty(`--icon-${cssClass}-color`, convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Colour]));
      break;
  }
}

//================================================================================================================================================================================//

const convertColourListToHex = (colourList: number[] | undefined = []): string => {
  if (colourList.length !== 3) {
    return STYLE_PRIMARY_TEXT_COLOR;
  }

  return "#".concat(colourList.map(x => x.toString(16).padStart(2, "0")).join(""));
};

//================================================================================================================================================================================//

const defaultImportColour = (cssClass: CssClass): string => cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT_COLOR : STYLE_ENERGY_GRID_IMPORT_COLOR;
const defaultExportColour = (cssClass: CssClass): string => cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT_COLOR : STYLE_ENERGY_GRID_EXPORT_COLOR;

//================================================================================================================================================================================//
