import { localize } from "@/localize/localize";
import { ColourOptions, EditorPages, EnergyDistributionExtConfig, HomeConfig } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { ColourMode, CssClass, EnergyDirection, GasSourcesMode, SIUnitPrefixes, VolumeUnits } from "@/enums";
import { Colours, STYLE_PRIMARY_TEXT_COLOR } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { Flows, States } from ".";
import { getConfigValue } from "@/config/config";
import { getGasSourcesMode, SegmentGroup } from "@/ui-helpers";
import { mdiFire, mdiFlash } from "@mdi/js";
import { Node } from "@/nodes/node";

//================================================================================================================================================================================//

const HOME_UI_ELEMENTS: ColourOptions[] = [ColourOptions.Circle, ColourOptions.Icon, ColourOptions.Value_Export, ColourOptions.Secondary];

//================================================================================================================================================================================//

export class HomeNode extends Node<HomeConfig> {
  public readonly colours: Colours;

  protected readonly defaultName: string = localize("EditorPages.home");
  protected readonly defaultIcon: string = "mdi:home";

  protected readonly _circleMode: ColourMode;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration) {
    super(hass, cardConfig, style, EditorPages.Home, CssClass.Home);
    this._circleMode = getConfigValue(this.coloursConfigs, ColourOptions.Circle);
    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Consumer_Only);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes): TemplateResult => {
    const segmentGroups: SegmentGroup[] = [];
    let electricIcon: string | undefined;
    let gasIcon: string | undefined;
    let electricTotal: number | undefined | null = !states ? null : this.getElectricState(states);
    let gasTotal: number | undefined | null;

    this.setCssVariables(this.style);

    if (getConfigValue(this.coloursConfigs, ColourOptions.Value_Export) !== ColourMode.Automatic) {
      this.style.setProperty(`--value-electric-home-color`, this.colours.getColour(ColourOptions.Value_Export));
      this.style.setProperty(`--value-gas-home-color`, this.colours.getColour(ColourOptions.Value_Export));
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
                state: states.grid.import > 0 ? states.lowCarbon * (flows.gridToHome / states.grid.import) : 0,
                cssClass: CssClass.Low_Carbon
              },
              {
                state: states.grid.import > 0 ? states.highCarbon * (flows.gridToHome / states.grid.import) : 0,
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
          electricTotal = !electricTotal ? this.getGasState(states) : electricTotal + (this.getGasState(states) ?? 0);
          gasTotal = undefined;
          electricIcon = gasIcon = undefined;
          break;

        case GasSourcesMode.Show_Separately:
          gasTotal = this.gasUnits === VolumeUnits.Same_As_Electric ? this.getGasState(states) : this.getGasVolumeState(states);
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
    } else if (this._circleMode == ColourMode.Dynamic) {
      segmentGroups.push({
        inactiveCss: this.useHassStyles ? CssClass.Grid_Import : CssClass.Inactive,
        segments: [{ state: 0, cssClass: CssClass.None }]
      });
    }

    const inactiveCss: string = !states || this.getElectricState(states) === 0 ? this.inactiveFlowsCss : CssClass.None;
    const electricCss: string = CssClass.Home + " " + CssClass.Electric;
    const gasCss: string = CssClass.Home + " " + CssClass.Gas;
    const borderCss: CssClass = this._circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : CssClass.None;

    return html`
      <div class="circle ${borderCss} ${inactiveCss}">
        ${this._circleMode === ColourMode.Dynamic ? this.renderSegmentedCircle(segmentGroups, circleSize, 0, this.showSegmentGaps) : nothing}
        ${this.renderSecondaryState(target, states)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        ${this.renderEnergyStateSpan(target, electricCss, this.electricUnits, undefined, electricIcon, electricTotal, false, overrideElectricPrefix)}
        ${this.renderEnergyStateSpan(target, gasCss, this._getVolumeUnits(), undefined, gasIcon, gasTotal, false, overrideGasPrefix)}
      </div>
    `;
  };

  //================================================================================================================================================================================//

  protected getElectricState(states?: States): number | undefined  {
    return states?.homeElectric;
  }

  //================================================================================================================================================================================//

  protected getGasState(states?: States): number | undefined  {
    return states?.homeGas;
  }

  //================================================================================================================================================================================//

  protected getGasVolumeState(states?: States): number | undefined {
    return states?.homeGasVolume;
  }

  //================================================================================================================================================================================//

  protected renderSecondaryState(target: LitElement, states?: States): TemplateResult  {
    return html`${this.renderSecondarySpan(target, this.secondary, states?.homeSecondary, CssClass.Home)}`;
  }

  //================================================================================================================================================================================//

  private _getVolumeUnits = (): string => this.gasUnits === VolumeUnits.Same_As_Electric ? this.electricUnits : this.gasUnits;

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

    const electricSources: object = {
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

    const gasSources: object = {
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
      if (getConfigValue(this.coloursConfigs, options) === ColourMode.Automatic) {
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

//================================================================================================================================================================================//
