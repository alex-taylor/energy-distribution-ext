import { EditorPages, EnergyFlowCardExtConfig, GasConfig } from "@/config";
import { Node } from "./node";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { CssClass, EnergyDirection, GAS_ENTITY_CLASSES, SIUnitPrefixes, VolumeUnits } from "@/enums";
import { EnergySource } from "@/hass";
import { html, LitElement, TemplateResult } from "lit";
import { States } from ".";
import { Colours } from "./colours";

//================================================================================================================================================================================//

export class GasNode extends Node<GasConfig> {
  public readonly colours: Colours;

  protected readonly defaultName: string = localize("EditorPages.gas");
  protected readonly defaultIcon: string = "mdi:fire";

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, energySources: EnergySource[]) {
    super(
      hass,
      cardConfig,
      style,
      EditorPages.Gas,
      CssClass.Gas,
      undefined,
      GAS_ENTITY_CLASSES,
      GasNode._getHassEntities(energySources)
    );

    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Producer_Only, "var(--energy-gas-color)");
    this.setCssVariables(style);
    this.style.setProperty("--flow-gas-color", this.colours.importFlow);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, _?, overrideGasPrefix?: SIUnitPrefixes): TemplateResult => {
    let units: string;
    let primaryState: number | undefined;

    if (this.gasUnits === VolumeUnits.Same_As_Electric) {
      primaryState = states?.gasImport;
      units = this.electricUnits;
    } else {
      primaryState = states?.gasImportVolume;
      units = this.gasUnits;
    }

    const inactiveCss: CssClass = !states || !primaryState ? this.inactiveFlowsCss : CssClass.None;

    return html`
      <div class="circle ${inactiveCss}">
        ${this.renderSecondarySpan(target, this.secondary, states?.gasSecondary, CssClass.Gas)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        ${this.renderEnergyStateSpan(target, CssClass.Gas, units, this.firstImportEntity, undefined, primaryState, overrideGasPrefix)}
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private static _getHassEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "gas").map(source => source.stat_energy_from!);
  }

  //================================================================================================================================================================================//
}
