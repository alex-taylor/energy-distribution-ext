import { ColourOptions, DualValueNodeConfig, EntitiesOptions, GlobalOptions, HomeConfig, HomeOptions, SingleValueNodeConfig } from "@/config";
import { STYLE_ENERGY_BATTERY_EXPORT_COLOR, STYLE_ENERGY_BATTERY_IMPORT_COLOR, STYLE_ENERGY_GRID_EXPORT_COLOR, STYLE_ENERGY_GRID_IMPORT_COLOR, STYLE_PRIMARY_TEXT_COLOR } from "@/const";
import { ColourMode, CssClass, FlowColourMode, GasSourcesMode } from "@/enums";
import { Flows, States } from "@/states";

const COLOUR_MAPPINGS: Map<ColourMode, CssClass> = new Map(
  [
    [ColourMode.Solar, CssClass.Solar],
    [ColourMode.High_Carbon, CssClass.GridImport],
    [ColourMode.Low_Carbon, CssClass.LowCarbon],
    [ColourMode.Battery, CssClass.BatteryImport],
    [ColourMode.Gas, CssClass.Gas]
  ]
);

//================================================================================================================================================================================//

export function setHomeNodeStaticStyles(config: HomeConfig, style: CSSStyleDeclaration): void {
  const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] || ColourMode.Dynamic;
  style.setProperty("--circle-home-color", circleMode === ColourMode.Do_Not_Colour ? STYLE_PRIMARY_TEXT_COLOR : `var(--flow-${COLOUR_MAPPINGS.get(circleMode)}-color)`);

  const iconMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon] || ColourMode.Do_Not_Colour;
  style.setProperty("--icon-home-color", iconMode === ColourMode.Do_Not_Colour ? STYLE_PRIMARY_TEXT_COLOR : `var(--flow-${COLOUR_MAPPINGS.get(iconMode)}-color)`);

  const valueMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Value] || ColourMode.Do_Not_Colour;
  style.setProperty("--text-home-color", valueMode === ColourMode.Do_Not_Colour ? STYLE_PRIMARY_TEXT_COLOR : `var(--flow-${COLOUR_MAPPINGS.get(valueMode)}-color)`);
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
        colour: "var(--flow-battery-import-color)"
      },
      solar: {
        value: flows.solarToHome,
        colour: "var(--flow-solar-color)"
      },
      highCarbon: {
        value: flows.gridToHome * (100 - states.lowCarbonPercentage) / 100,
        colour: "var(--flow-grid-import-color)"
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

    if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Largest_Value) {
      style.setProperty("--circle-home-color", homeSources[homeLargestSource].colour);
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
  const customColour: string = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Custom_Colour]) || energyColour;
  const flowColour: string = config?.[EntitiesOptions.Colours]?.[ColourOptions.Flow] === FlowColourMode.Custom ? customColour : energyColour;
  let textColour: string;
  let iconColour: string;

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Value]) {
    case ColourMode.Flow:
      textColour = flowColour;
      break;

    case ColourMode.Do_Not_Colour:
    default:
      textColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon] || (cssClass === CssClass.LowCarbon ? ColourMode.Flow : ColourMode.Do_Not_Colour)) {
    case ColourMode.Flow:
      iconColour = flowColour;
      break;

    case ColourMode.Do_Not_Colour:
    default:
      iconColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  style.setProperty(`--text-${cssClass}-color`, textColour);
  style.setProperty(`--icon-${cssClass}-color`, iconColour);
  style.setProperty(`--circle-${cssClass}-color`, flowColour);
  style.setProperty(`--flow-${cssClass}-color`, flowColour);
}

//================================================================================================================================================================================//

export function setDualValueNodeStaticStyles(config: DualValueNodeConfig, cssClass: CssClass, style: CSSStyleDeclaration): void {
  const energyImportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT_COLOR : STYLE_ENERGY_GRID_IMPORT_COLOR;
  const energyExportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT_COLOR : STYLE_ENERGY_GRID_EXPORT_COLOR;
  let circleColour: string = "";
  let textImportColour: string;
  let textExportColour: string;
  let flowImportColour: string;
  let flowExportColour: string;
  let iconColour: string;

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Flow] === FlowColourMode.Custom) {
    flowImportColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Colour]) || energyImportColour;
  } else {
    flowImportColour = energyImportColour;
  }

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Export_Flow] === FlowColourMode.Custom) {
    flowExportColour = convertColourListToHex(config?.[EntitiesOptions.Colours]?.[ColourOptions.Export_Colour]) || energyExportColour;
  } else {
    flowExportColour = energyExportColour;
  }

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Import) {
    circleColour = flowImportColour;
  }

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Export) {
    circleColour = flowExportColour;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Values]) {
    case ColourMode.Flow:
      textImportColour = flowImportColour;
      textExportColour = flowExportColour;
      break;

    case ColourMode.Do_Not_Colour:
    default:
      textImportColour = STYLE_PRIMARY_TEXT_COLOR;
      textExportColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  switch (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon]) {
    case ColourMode.Import:
      iconColour = flowImportColour;
      break;

    case ColourMode.Export:
      iconColour = flowExportColour;
      break;

    case ColourMode.Do_Not_Colour:
    default:
      iconColour = STYLE_PRIMARY_TEXT_COLOR;
      break;
  }

  style.setProperty(`--text-${cssClass}-import-color`, textImportColour);
  style.setProperty(`--text-${cssClass}-export-color`, textExportColour);
  style.setProperty(`--icon-${cssClass}-color`, iconColour);
  style.setProperty(`--circle-${cssClass}-color`, circleColour);
  style.setProperty(`--flow-${cssClass}-import-color`, flowImportColour);
  style.setProperty(`--flow-${cssClass}-export-color`, flowExportColour);
}

//================================================================================================================================================================================//

export function setDualValueNodeDynamicStyles(config: DualValueNodeConfig, cssClass: CssClass, exportState: number, importState: number, style: CSSStyleDeclaration): void {
  const importColour = `var(--flow-${cssClass}-import-color)`;
  const exportColour = `var(--flow-${cssClass}-export-color)`;
  let circleColour: string;

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Larger_Value) {
    if (exportState > importState) {
      circleColour = exportColour;
    } else {
      circleColour = importColour;
    }

    style.setProperty(`--circle-${cssClass}-color`, circleColour);
  }

  if (config?.[EntitiesOptions.Colours]?.[ColourOptions.Icon] === ColourMode.Larger_Value) {
    let iconColour: string;

    if (exportState > importState) {
      iconColour = exportColour;
    } else {
      iconColour = importColour;
    }

    style.setProperty(`--icon-${cssClass}-color`, iconColour);
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
