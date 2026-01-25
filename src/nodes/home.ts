import { localize } from "@/localize/localize";
import { ColourOptions, EditorPages, EnergyFlowCardExtConfig, HomeConfig } from "@/config";
import { Node } from "./node";
import { HomeAssistant } from "custom-card-helpers";
import { ColourMode, CssClass, EnergyDirection, GasSourcesMode, SIUnitPrefixes, VolumeUnits } from "@/enums";
import { Colours, STYLE_PRIMARY_TEXT_COLOR } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { Flows, States } from ".";
import { getConfigValue } from "@/config/config";
import { getGasSourcesMode, SegmentGroup } from "@/ui-helpers";
import { mdiFire, mdiFlash } from "@mdi/js";

//================================================================================================================================================================================//

const HOME_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value_Export, ColourOptions.Secondary];

//================================================================================================================================================================================//

export class HomeNode extends Node<HomeConfig> {
  public readonly colours: Colours;

  protected readonly defaultName: string = localize("EditorPages.home");
  protected readonly defaultIcon: string = "mdi:home";

  private _circleMode: ColourMode;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration) {
    super(hass, cardConfig, style, EditorPages.Home, CssClass.Home);
    this._circleMode = getConfigValue(this.coloursConfigs, ColourOptions.Circle);
    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Consumer_Only);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, overrideElectricUnitPrefix?: SIUnitPrefixes, overrideGasUnitPrefix?: SIUnitPrefixes): TemplateResult => {
    const segmentGroups: SegmentGroup[] = [];
    let electricIcon: string | undefined;
    let gasIcon: string | undefined;
    let electricTotal: number | undefined = states?.homeElectric;
    let gasTotal: number | undefined;

    this.setCssVariables(this.style);

    if (getConfigValue(this.coloursConfigs, ColourOptions.Value_Export) !== ColourMode.Largest_Value) {
      this.style.setProperty(`--value-electric-home-color`, this.colours.exportValue);
      this.style.setProperty(`--value-gas-home-color`, this.colours.exportValue);
    }

    if (states) {
      const gasSourcesMode: GasSourcesMode = states.gasPresent ? getGasSourcesMode(this.nodeConfigs, states) : GasSourcesMode.Do_Not_Show;

      if (this._circleMode === ColourMode.Dynamic) {
        const flows: Flows = states.flows;

        segmentGroups.push(
          {
            inactiveCss: this.useHassStyles ? CssClass.Grid_Import : CssClass.Inactive,
            segments: [
              {
                state: flows.solarToHome,
                cssClass: CssClass.Solar
              },
              {
                state: flows.batteryToHome,
                cssClass: CssClass.Battery_Import
              },
              {
                state: states.lowCarbon * (flows.gridToHome / states.grid.import),
                cssClass: CssClass.Low_Carbon
              },
              {
                state: states.highCarbon * (flows.gridToHome / states.grid.import),
                cssClass: CssClass.Grid_Import
              }
            ]
          }
        );

        segmentGroups[0].segments.unshift(
          ...(states.devicesElectric.map((deviceState, index) => {
            return {
              state: deviceState.import,
              cssClass: `import-${CssClass.Device}-${index}` as CssClass
            };
          }))
        );

        if (gasSourcesMode !== GasSourcesMode.Do_Not_Show) {
          segmentGroups[0].segments.unshift({
            state: states.gasImport,
            cssClass: CssClass.Gas
          },
            ...(states.devicesGas.map((deviceState, index) => {
              return {
                state: deviceState.import,
                cssClass: `import-${CssClass.Device}-${index}` as CssClass
              };
            }))
          );
        }
      }

      switch (gasSourcesMode) {
        case GasSourcesMode.Add_To_Total:
          electricTotal! += states.homeGas;
          gasTotal = undefined;
          electricIcon = gasIcon = undefined;
          break;

        case GasSourcesMode.Show_Separately:
          gasTotal = this.volumeUnits === VolumeUnits.Same_As_Electric ? states.homeGas : states.homeGasVolume;
          electricIcon = mdiFlash;
          gasIcon = mdiFire;
          break;

        case GasSourcesMode.Do_Not_Show:
        default:
          gasTotal = undefined;
          electricIcon = gasIcon = undefined;
          break;
      }

      this._setHomeNodeCssVariables(states, this.style);
    }

    const inactiveCss: string = !states || states.homeElectric === 0 ? this.inactiveFlowsCss : CssClass.None;
    const electricCss: string = CssClass.Home + " " + CssClass.Electric;
    const gasCss: string = CssClass.Home + " " + CssClass.Gas;
    const borderCss: CssClass = this._circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : CssClass.None;

    return html`
      <div class="circle ${borderCss} ${inactiveCss}">
        ${this._circleMode === ColourMode.Dynamic ? this.renderSegmentedCircle(segmentGroups, circleSize, 0, this.showSegmentGaps) : nothing}
        ${this.renderSecondarySpan(target, this.secondary, states?.homeSecondary, CssClass.Home)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        ${this.renderEnergyStateSpan(target, electricCss, this.energyUnits, undefined, electricIcon, electricTotal, overrideElectricUnitPrefix)}
        ${this.renderEnergyStateSpan(target, gasCss, this._getVolumeUnits(), undefined, gasIcon, gasTotal, overrideGasUnitPrefix)}
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _getVolumeUnits = (): string => this.volumeUnits === VolumeUnits.Same_As_Electric ? this.energyUnits : this.volumeUnits;

  //================================================================================================================================================================================//

  private _setHomeNodeCssVariables(states: States, style: CSSStyleDeclaration): void {
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
    };

    states.devicesElectric.forEach((device, index) => {
      electricSources[`device-${index}`] = {
        value: device.import,
        colour: `var(--flow-import-device-${index}-color)`
      }
    });

    const electricLargestSource: string = Object.keys(electricSources).reduce((a, b) => electricSources[a].value > electricSources[b].value ? a : b);
    const electricLargestColour: string = electricSources[electricLargestSource].colour;

    const gasSources: {} = {
      gas: {
        value: states.gasImport,
        colour: "var(--flow-gas-color)"
      }
    };

    states.devicesGas.forEach((device, index) => {
      gasSources[`device-${index}`] = {
        value: device.import,
        colour: `var(--flow-import-device-${index}-color)`
      }
    });

    const gasSourcesMode: GasSourcesMode = getGasSourcesMode(this.nodeConfigs, states);
    const gasLargestSource: string = Object.keys(gasSources).reduce((a, b) => gasSources[a].value > gasSources[b].value ? a : b);
    const gasLargestColour: string = gasSources[gasLargestSource].colour;
    const homeLargestColour: string = gasSourcesMode === GasSourcesMode.Do_Not_Show || electricSources[electricLargestSource].value >= gasSources[gasLargestSource].value ? electricLargestColour : gasLargestColour;

    HOME_UI_ELEMENTS.forEach(options => {
      if (getConfigValue(this.coloursConfigs, options) === ColourMode.Largest_Value) {
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
}
