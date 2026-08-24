import { HomeAssistant, round } from "custom-card-helpers";
import { EnergyDistributionExtConfig, NodeOptions, OverridesOptions } from "@/config";
import { HomeNode } from "@/nodes/home";
import { ColourMode, CssClass } from "@/enums";
import { States } from "@/nodes/index";
import { html, LitElement, TemplateResult } from "lit";
import { localize } from "@/localize/localize";
import { MAX_DECIMALS } from "@/const";
import { getConfigValue } from "@/config/config";

//================================================================================================================================================================================//

export class DeviceBus extends HomeNode {

  public readonly cssClass: CssClass = CssClass.Device_Bus;
  protected readonly defaultName: string = "";
  protected readonly defaultIcon: string = "";
  protected readonly circleMode: ColourMode = ColourMode.Do_Not_Colour;
  private readonly _defaultUntrackedConsumption: string;

  public constructor(hass: HomeAssistant, cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration) {
    super(hass, cardConfig, style);

    this._defaultUntrackedConsumption = getConfigValue(this.nodeConfigs, [NodeOptions.Overrides, OverridesOptions.UntrackedConsumption]) || localize("common.untracked");
  }

  //================================================================================================================================================================================//

  protected getElectricState(states?: States): number | undefined {
    return !states ? undefined : this._getState(states.homeElectric, states.untrackedElectric);
  }

  //================================================================================================================================================================================//

  protected getGasState(states?: States): number | undefined {
    return !states ? undefined : this._getState(states.homeGas, states.untrackedGas);
  }

  //================================================================================================================================================================================//

  protected getGasVolumeState(states?: States): number | undefined {
    return !states ? undefined : this._getState(states.homeGasVolume, states.untrackedGasVolume);
  }

  //================================================================================================================================================================================//

  protected renderSecondaryState(_target: LitElement, _states?: States): TemplateResult {
    return html`<span class="untracked">${this._defaultUntrackedConsumption}</span>`;
  }

  //================================================================================================================================================================================//

  private _getState(homeState: number, untrackedState: number): number | undefined {
    homeState = round(homeState, MAX_DECIMALS) || 0;
    untrackedState = round(untrackedState, MAX_DECIMALS) || 0;
    return homeState === untrackedState || untrackedState === 0 ? undefined : untrackedState;
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//
