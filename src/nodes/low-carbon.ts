import { localize } from "@/localize/localize";
import { EditorPages, EnergyFlowCardExtConfig, GlobalOptions, LowCarbonConfig, LowCarbonOptions } from "@/config";
import { Node } from "./node";
import { HomeAssistant, round } from "custom-card-helpers";
import { getCo2SignalEntity, getConfigValue } from "@/config/config";
import { CssClass, DeviceClasses, EnergyDirection, LowCarbonDisplayMode, SIUnitPrefixes } from "@/enums";
import { Colours } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { States } from ".";
import { HassEntity } from "home-assistant-js-websocket";

//================================================================================================================================================================================//

const MAP_URL: string = "https://app.electricitymaps.com";

//================================================================================================================================================================================//

export class LowCarbonNode extends Node<LowCarbonConfig> {
  public readonly colours: Colours;

  protected readonly defaultName: string = localize("common.low_carbon");
  protected readonly defaultIcon: string = "mdi:leaf";

  private _displayMode: LowCarbonDisplayMode;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration) {
    super(
      hass,
      cardConfig,
      style,
      EditorPages.Low_Carbon,
      CssClass.Low_Carbon,
      undefined,
      [DeviceClasses.None],
      [getCo2SignalEntity(hass)]
    );

    this._displayMode = getConfigValue(this.nodeConfigs, [GlobalOptions.Options, LowCarbonOptions.Low_Carbon_Mode]);
    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Producer_Only, "var(--energy-non-fossil-color)");
    this.setCssVariables(style);
    this.style.setProperty("--flow-non-fossil-color", this.colours.importFlow);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, overridePrefix?: SIUnitPrefixes): TemplateResult => {
    let electricityMapUrl: string = MAP_URL;
    const co2State: HassEntity = this.hass.states[getCo2SignalEntity(this.hass)];

    if (co2State?.attributes.country_code) {
      electricityMapUrl += `/zone/${co2State?.attributes.country_code}`;
    }

    const energyState: number | undefined = !states || this._displayMode === LowCarbonDisplayMode.Percentage ? undefined : states.grid.import === 0 ? 0 : states.lowCarbon;
    const energyPercentage: number | undefined = !states || this._displayMode === LowCarbonDisplayMode.Energy ? undefined : states.grid.import === 0 ? 0 : round(states.lowCarbonPercentage, 1);
    const inactiveCss: CssClass = !energyState && !energyPercentage ? this.inactiveFlowsCss : CssClass.None;

    return html`
      <div class="circle ${inactiveCss}">
        ${this.renderSecondarySpan(target, this.secondary, states?.lowCarbonSecondary, CssClass.Low_Carbon)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        <a href=${electricityMapUrl} style="text-decoration: none;" target="_blank" rel="noopener noreferrer">
          ${this.renderEnergyStateSpan(target, CssClass.Low_Carbon, this.electricUnits, undefined, undefined, energyState, overridePrefix)}<br/>
          ${energyPercentage ? energyState ? html`<span class="value ${CssClass.Low_Carbon}"}>(${energyPercentage}%)</span>` : html`<span class="value ${CssClass.Low_Carbon}"}>${energyPercentage}%</span>` : nothing}
        </a>
      </div>
    `;
  }
}
