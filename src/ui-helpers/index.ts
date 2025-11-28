import { svg, TemplateResult } from "lit";
import { ColourOptions, DualValueNodeConfig, EntitiesOptions, SingleValueNodeConfig } from "@/config";
import { ColourMode, CssClass } from "@/enums";
import { STYLE_ENERGY_BATTERY_EXPORT, STYLE_ENERGY_BATTERY_IMPORT, STYLE_ENERGY_GRID_EXPORT, STYLE_ENERGY_GRID_IMPORT, STYLE_ENERGY_NON_FOSSIL_COLOR, STYLE_PRIMARY_TEXT_COLOR } from "@/const";

//================================================================================================================================================================================//

export const renderLine = (id: string, path: string, cssClass: string | undefined = undefined): TemplateResult => {
  return svg`<path id="${id}" class="${cssClass || id}" d="${path}" vector-effect="non-scaling-stroke"/>`;
};

//================================================================================================================================================================================//

export const renderDot = (size: number, cssClass: string, duration: number, reverseDirection: boolean = false, pathRef: string | undefined = undefined): TemplateResult => {
  return svg`
      <circle r="${size}" class="${cssClass}" vector-effect="non-scaling-stroke">
        <animateMotion dur="${duration}s" repeatCount="indefinite" keyPoints="${reverseDirection ? "1; 0" : "0; 1"}" keyTimes="0; 1" calcMode="linear">
          <mpath xlink: href = "#${pathRef ?? cssClass}"/>
        </animateMotion>
      </circle>
      `;
};

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
      textColour = customColour ?? STYLE_PRIMARY_TEXT_COLOR;
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
  const energyImportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT : STYLE_ENERGY_GRID_IMPORT;
  const energyExportColour: string = cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT : STYLE_ENERGY_GRID_EXPORT;
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
      textImportColour = STYLE_PRIMARY_TEXT_COLOR;
      textExportColour = STYLE_PRIMARY_TEXT_COLOR;
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

const defaultImportColour = (cssClass: CssClass): string => cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_IMPORT : STYLE_ENERGY_GRID_IMPORT;
const defaultExportColour = (cssClass: CssClass): string => cssClass === CssClass.Battery ? STYLE_ENERGY_BATTERY_EXPORT : STYLE_ENERGY_GRID_EXPORT;

//================================================================================================================================================================================//
