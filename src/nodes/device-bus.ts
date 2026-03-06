import { HomeAssistant } from "custom-card-helpers";
import { EnergyDistributionExtConfig } from "@/config";
import { HomeNode } from "@/nodes/home";
import { ColourMode } from "@/enums";
import { States } from "@/nodes/index";
import { html, LitElement, TemplateResult } from "lit";
import { localize } from "@/localize/localize";

//================================================================================================================================================================================//

export class DeviceBus extends HomeNode {

  protected readonly defaultName: string = "";
  protected readonly defaultIcon: string = "";
  protected readonly _circleMode: ColourMode = ColourMode.Do_Not_Colour;

  public constructor(hass: HomeAssistant, cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration) {
    super(hass, cardConfig, style);
  }

  //================================================================================================================================================================================//

  protected getElectricState(states?: States): number | undefined {
    return states?.untrackedElectric === states?.homeElectric ? undefined : states?.untrackedElectric;
  }

  //================================================================================================================================================================================//

  protected getGasState(states?: States): number | undefined {
    return states?.untrackedGas === states?.homeGas ? undefined : states?.untrackedGas;
  }

  //================================================================================================================================================================================//

  protected getGasVolumeState(states?: States): number | undefined {
    return states?.untrackedGasVolume === states?.homeGasVolume ? undefined : states?.untrackedGasVolume;
  }

  //================================================================================================================================================================================//

  protected renderSecondaryState(_target: LitElement, _states?: States): TemplateResult {
    return html`<span class="untracked">${localize("common.untracked")}</span>`;
  }

}

//================================================================================================================================================================================//
