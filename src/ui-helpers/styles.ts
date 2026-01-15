import { ColourOptions, ColoursConfig, NodeOptions, HomeConfig } from "@/config";
import { ColourMode, CssClass, GasSourcesMode } from "@/enums";
import { Flows, States } from "@/states";
import { getGasSourcesMode } from ".";
import { getConfigObjects, getConfigValue } from "@/config/config";
import { Colours, State } from "@/states/state";

export interface MinMax {
  min: number;
  max: number;
}

export const COLOUR_MAPPINGS: Map<ColourMode, string> = new Map(
  [
    [ColourMode.Solar, "solar"],
    [ColourMode.High_Carbon, "import-grid"],
    [ColourMode.Low_Carbon, "non-fossil"],
    [ColourMode.Battery, "import-battery"],
    [ColourMode.Gas, "gas"]
  ]
);

export const STYLE_PRIMARY_TEXT_COLOR: string = "var(--primary-text-color)";

const HOME_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value_Export, ColourOptions.Secondary];

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

export function setCssVariables(style: CSSStyleDeclaration, state: State): void {
  const cssClass: CssClass = state.cssClass;
  const colours: Colours = state.colours;

  style.setProperty(`--circle-${cssClass}-color`, colours.circle);
  style.setProperty(`--icon-${cssClass}-color`, colours.icon);
  style.setProperty(`--importValue-${cssClass}-color`, colours.importValue);
  style.setProperty(`--exportValue-${cssClass}-color`, colours.exportValue);
  style.setProperty(`--secondary-${cssClass}-color`, colours.secondary);
}

//================================================================================================================================================================================//

export function setHomeNodeCssVariables(configs: HomeConfig[], states: States, style: CSSStyleDeclaration): void {
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

  const gasSourcesMode: GasSourcesMode = getGasSourcesMode(configs, states);
  const gasLargestSource: string = Object.keys(gasSources).reduce((a, b) => gasSources[a].value > gasSources[b].value ? a : b);
  const gasLargestColour: string = gasSources[gasLargestSource].colour;
  const homeLargestColour: string = gasSourcesMode === GasSourcesMode.Do_Not_Show || electricSources[electricLargestSource].value >= gasSources[gasLargestSource].value ? electricLargestColour : gasLargestColour;
  const colourConfig: ColoursConfig[] = getConfigObjects(configs, NodeOptions.Colours);

  HOME_UI_ELEMENTS.forEach(options => {
    if (getConfigValue(colourConfig, options) === ColourMode.Largest_Value) {
      if (options === ColourOptions.Value_Export) {
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

export function convertColourListToHex(colourList: number[] | undefined = []): string {
  if (colourList.length !== 3) {
    return STYLE_PRIMARY_TEXT_COLOR;
  }

  return "#".concat(colourList.map(x => x.toString(16).padStart(2, "0")).join(""));
};

//================================================================================================================================================================================//
