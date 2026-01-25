import { BatteryConfig, ColourOptions, EditorPages, EnergyFlowCardExtConfig, NodeOptions } from "@/config";
import { Node } from "./node";
import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { EnergySource } from "@/hass";
import { ColourMode, CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection, SIUnitPrefixes } from "@/enums";
import { BiDiState, Flows, States } from ".";
import { Colours } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { getConfigValue } from "@/config/config";
import { SegmentGroup } from "@/ui-helpers";

//================================================================================================================================================================================//

export class BatteryNode extends Node<BatteryConfig> {
  public readonly colours: Colours;
  public exportIcon: string = "";
  public importIcon: string = "";

  protected readonly defaultName: string = localize("EditorPages.battery");
  protected readonly defaultIcon: string = "mdi:battery-high";

  private _circleMode: ColourMode;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, state: BiDiState = { import: 0, export: 0 }, energySources: EnergySource[]) {
    super(
      hass,
      cardConfig,
      style,
      EditorPages.Battery,
      CssClass.Battery,
      undefined,
      ELECTRIC_ENTITY_CLASSES,
      BatteryNode._getHassImportEntities(energySources),
      BatteryNode._getHassExportEntities(energySources)
    );

    this._circleMode = getConfigValue(this.cardConfigs, [EditorPages.Battery, NodeOptions.Colours, ColourOptions.Circle]);
    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Both, state, "var(--energy-battery-out-color)", "var(--energy-battery-in-color)");
    this.setCssVariables(this.style);
    this.style.setProperty("--flow-export-battery-color", this.colours.exportFlow);
    this.style.setProperty("--flow-import-battery-color", this.colours.importFlow);
}

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, overridePrefix?: SIUnitPrefixes): TemplateResult => {
    const segmentGroups: SegmentGroup[] = [];

    if (states) {
      if (this._circleMode === ColourMode.Dynamic) {
        const flows: Flows = states.flows;

        if (this.firstExportEntity) {
          const highCarbon: number = 1 - (states.lowCarbonPercentage / 100);

          segmentGroups.push(
            {
              inactiveCss: CssClass.Battery_Export,
              segments: [
                {
                  state: flows.gridToBattery * highCarbon,
                  cssClass: CssClass.Grid_Import
                },
                {
                  state: flows.gridToBattery * (1 - highCarbon),
                  cssClass: CssClass.Low_Carbon
                },
                {
                  state: flows.solarToBattery,
                  cssClass: CssClass.Solar
                }
              ]
            }
          );
        }

        if (this.firstImportEntity) {
          segmentGroups.push(
            {
              inactiveCss: CssClass.Battery_Import,
              segments: [
                {
                  state: flows.batteryToHome,
                  cssClass: CssClass.Battery_Import
                },
                {
                  state: flows.batteryToGrid,
                  cssClass: CssClass.Grid_Export
                }
              ]
            }
          );
        }
      }

      this.setCssVariables(this.style);
    }

    const importState: number | undefined = states && this.firstImportEntity ? states.battery.import : undefined;
    const exportState: number | undefined = states && this.firstExportEntity ? states.battery.export : undefined;
    const inactiveCss: string = !states || (!states.battery.import && !states.battery.export) ? this.inactiveFlowsCss : CssClass.None;
    const borderCss: CssClass = this._circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : CssClass.None;

    return html`
      <div class="circle ${borderCss} ${inactiveCss}">
        ${this._circleMode === ColourMode.Dynamic ? this.renderSegmentedCircle(segmentGroups, circleSize, 180, this.showSegmentGaps) : nothing}
        ${this.renderSecondarySpan(target, this.secondary, states?.batterySecondary, CssClass.Battery)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        ${this.renderEnergyStateSpan(target, CssClass.Battery_Export, this.energyUnits, this.firstExportEntity, this.exportIcon, exportState, overridePrefix)}
        ${this.renderEnergyStateSpan(target, CssClass.Battery_Import, this.energyUnits, this.firstImportEntity, this.importIcon, importState, overridePrefix)}
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_from).map(source => source.stat_energy_from!);
  }

  //================================================================================================================================================================================//

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources.filter(source => source.type === "battery").filter(source => source.stat_energy_to).map(source => source.stat_energy_to!);
  }

  //================================================================================================================================================================================//
}
