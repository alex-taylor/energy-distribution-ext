import { ColourOptions, DualValueNodeConfig, EntitiesOptions, GlobalOptions, HomeConfig, HomeOptions, SingleValueNodeConfig } from "@/config";
import { STYLE_ENERGY_BATTERY_EXPORT_COLOR, STYLE_ENERGY_BATTERY_IMPORT_COLOR, STYLE_ENERGY_GRID_EXPORT_COLOR, STYLE_ENERGY_GRID_IMPORT_COLOR, STYLE_PRIMARY_TEXT_COLOR } from "@/const";
import { ColourMode, CssClass, GasSourcesMode } from "@/enums";
import { Flows, States } from "@/states";

const COLOUR_MAPPINGS: Map<ColourMode, CssClass> = new Map(
  [
    [ColourMode.Solar, CssClass.Solar],
    [ColourMode.High_Carbon, CssClass.Grid_Import],
    [ColourMode.Low_Carbon, CssClass.Low_Carbon],
    [ColourMode.Battery, CssClass.Battery_Import],
    [ColourMode.Gas, CssClass.Gas]
  ]
);

const HOME_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value, ColourOptions.Secondary];
const SINGLE_NODE_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Icon, ColourOptions.Value, ColourOptions.Secondary];
const DUAL_NODE_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value_Import, ColourOptions.Value_Export, ColourOptions.Secondary];

//================================================================================================================================================================================//

export function setHomeNodeStaticStyles(config: HomeConfig, style: CSSStyleDeclaration): void {
  HOME_UI_ELEMENTS.forEach(options => {
    const defaultMode: ColourMode = options === ColourOptions.Circle ? ColourMode.Dynamic : ColourMode.Do_Not_Colour;
    const mode: ColourMode = config?.[EntitiesOptions.Colours]?.[options] || defaultMode;
    let colour: string;

    switch (mode) {
      case ColourMode.Do_Not_Colour:
        colour = STYLE_PRIMARY_TEXT_COLOR;
        break;

      case ColourMode.Custom:
        colour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[options.replace("mode", "colour")]) || STYLE_PRIMARY_TEXT_COLOR;
        break;

      default:
        colour = `var(--flow-${COLOUR_MAPPINGS.get(mode)}-color)`;
        break;
    }

    style.setProperty(`--${options.replace("_mode", "")}-home-color`, colour);
  });
}

//================================================================================================================================================================================//

export function setHomeNodeDynamicStyles(config: HomeConfig, states: States, style: CSSStyleDeclaration): void {
  if (states.home <= 0) {
    style.setProperty("--circle-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--icon-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--value-home-color", STYLE_PRIMARY_TEXT_COLOR);
    style.setProperty("--secondary-home-color", STYLE_PRIMARY_TEXT_COLOR);
    return;
  }

  const flows: Flows = states.flows;

  const homeSources = {
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
    },

    // TODO: electric-producing devices
  };

  // TODO: refactor this out, it also needs to handle gas-producing devices
  if (config?.[GlobalOptions.Options]?.[HomeOptions.Gas_Sources] !== GasSourcesMode.Do_Not_Show) {
    homeSources["gas"] = {
      value: states.gasImport,
      colour: "var(--flow-gas-color)"
    };
  }

  const homeLargestSource: string = Object.keys(homeSources).reduce((a, b) => homeSources[a].value > homeSources[b].value ? a : b);
  const homeLargestColour: string = homeSources[homeLargestSource].colour;

  HOME_UI_ELEMENTS.forEach(options => {
    if (config?.[EntitiesOptions.Colours]?.[options] === ColourMode.Largest_Value) {
      style.setProperty(`--${options.replace("_mode", "")}-home-color`, homeLargestColour);
    }
  });
}

//================================================================================================================================================================================//

export function setSingleValueNodeStyles(config: SingleValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyColour: string = `var(--energy-${cssClass}-color)`;
  let flowColour: string;

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow] === ColourMode.Custom) {
    flowColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow_Colour]) || energyColour;
  } else {
    flowColour = energyColour;
  }

  style.setProperty(`--flow-${cssClass}-color`, flowColour);
  style.setProperty(`--circle-${cssClass}-color`, flowColour);

  SINGLE_NODE_UI_ELEMENTS.forEach(options => {
    const defaultMode: ColourMode = cssClass === CssClass.Low_Carbon && options === ColourOptions.Icon ? ColourMode.Flow : ColourMode.Do_Not_Colour;
    const mode: ColourMode = config?.[EntitiesOptions.Colours]?.[options] || defaultMode;
    let colour: string;

    switch (mode) {
      case ColourMode.Flow:
        colour = flowColour;
        break;

      case ColourMode.Custom:
        colour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[options.replace("mode", "colour")]) || STYLE_PRIMARY_TEXT_COLOR;
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

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow_Import] === ColourMode.Custom) {
    flowImportColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow_Import_Colour]) || energyImportColour;
  } else {
    flowImportColour = energyImportColour;
  }

  style.setProperty(`--flow-import-${cssClass}-color`, flowImportColour);

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow_Export] === ColourMode.Custom) {
    flowExportColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow_Export_Colour]) || energyExportColour;
  } else {
    flowExportColour = energyExportColour;
  }

  style.setProperty(`--flow-export-${cssClass}-color`, flowExportColour);

  DUAL_NODE_UI_ELEMENTS.forEach(options => {
    const defaultColour: string = options === ColourOptions.Circle || options === ColourOptions.Value_Import ? flowImportColour : options === ColourOptions.Value_Export ? flowExportColour : STYLE_PRIMARY_TEXT_COLOR;
    const mode: ColourMode = config?.[EntitiesOptions.Colours]?.[options];
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
        colour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[options.replace("mode", "colour")]) || defaultColour;
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
    if (config?.[EntitiesOptions.Colours]?.[options] === ColourMode.Larger_Value) {
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
