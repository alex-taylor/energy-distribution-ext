import { localize } from "@/localize/localize";
import { ColourOptions, EditorPages, EnergyFlowCardExtConfig, GridConfig, GridOptions, PowerOutageConfig, PowerOutageOptions } from "@/config";
import { Node } from "./node";
import { HomeAssistant } from "custom-card-helpers";
import { getConfigObjects, getConfigValue } from "@/config/config";
import { EnergySource } from "@/hass";
import { ColourMode, CssClass, ELECTRIC_ENTITY_CLASSES, EnergyDirection, SIUnitPrefixes } from "@/enums";
import { BiDiState, Flows, States } from ".";
import { Colours } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { SegmentGroup } from "@/ui-helpers";
import { mdiArrowLeft, mdiArrowRight } from "@mdi/js";

//================================================================================================================================================================================//

export class GridNode extends Node<GridConfig> {
  public readonly colours: Colours;

  public readonly powerOutage: {
    isPresent: boolean;
    isOutage: boolean;
    icon: string;
    state: string;
    entity_id: string;
  };

  protected readonly defaultName: string = localize("EditorPages.grid");
  protected readonly defaultIcon: string = "mdi:transmission-tower";

  private _circleMode: ColourMode;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, state: BiDiState = { import: 0, export: 0 }, energySources: EnergySource[]) {
    super(
      hass,
      cardConfig,
      style,
      EditorPages.Grid,
      CssClass.Grid,
      undefined,
      ELECTRIC_ENTITY_CLASSES,
      GridNode._getHassImportEntities(energySources),
      GridNode._getHassExportEntities(energySources)
    );

    const powerOutageConfig: PowerOutageConfig[] = getConfigObjects(this.nodeConfigs, GridOptions.Power_Outage);

    this.powerOutage = {
      isPresent: getConfigValue(powerOutageConfig, PowerOutageOptions.Entity_Id) !== undefined,
      isOutage: false,
      icon: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_Icon) || "mdi:transmission-tower-off",
      state: getConfigValue(powerOutageConfig, PowerOutageOptions.Alert_State),
      entity_id: getConfigValue(powerOutageConfig, PowerOutageOptions.Entity_Id)
    };

    this._circleMode = getConfigValue(this.coloursConfigs, ColourOptions.Circle);
    this.colours = new Colours(this.coloursConfigs, EnergyDirection.Both, state, "var(--energy-grid-consumption-color)", "var(--energy-grid-return-color)");
    this.setCssVariables(style);
    this.style.setProperty("--flow-export-grid-color", this.colours.exportFlow);
    this.style.setProperty("--flow-import-grid-color", this.colours.importFlow);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, circleSize: number, states?: States, overridePrefix?: SIUnitPrefixes): TemplateResult => {
    const segmentGroups: SegmentGroup[] = [];

    if (states) {
      if (this._circleMode === ColourMode.Dynamic) {
        const flows: Flows = states.flows;

        if (this.firstExportEntity) {
          segmentGroups.push(
            {
              inactiveCss: CssClass.Grid_Export,
              segments: [
                {
                  state: flows.solarToGrid,
                  cssClass: CssClass.Solar
                },
                {
                  state: flows.batteryToGrid,
                  cssClass: CssClass.Battery_Import
                }
              ]
            }
          );
        }

        if (this.firstImportEntity) {
          const highCarbon: number = 1 - (states.lowCarbonPercentage / 100);

          segmentGroups.push(
            {
              inactiveCss: CssClass.Grid_Import,
              segments: [
                {
                  state: flows.gridToBattery,
                  cssClass: CssClass.Battery_Export
                },
                {
                  state: flows.gridToHome * highCarbon,
                  cssClass: CssClass.Grid_Import
                },
                {
                  state: flows.gridToHome * (1 - highCarbon),
                  cssClass: CssClass.Low_Carbon
                }
              ]
            }
          );
        }
      }

      this.setCssVariables(this.style);
    }

    const inactiveCss: string = !states || (!states.grid.import  && !states.grid.export) ? this.inactiveFlowsCss : CssClass.None;
    const importCss: string = CssClass.Grid_Import + " " + (!states || !states.grid.import ? inactiveCss : CssClass.None);
    const exportCss: string = CssClass.Grid_Export + " " + (!states || !states.grid.export ? inactiveCss : CssClass.None);
    const secondaryCss: string = CssClass.Grid + " " + inactiveCss;
    const borderCss: CssClass = this._circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : CssClass.None;
    const importState: number | undefined = states && this.firstImportEntity ? states.grid.import : undefined;
    const exportState: number | undefined = states && this.firstExportEntity ? states.grid.export : undefined;
    const isOutage: boolean = this.powerOutage.isOutage;
    const icon: string = isOutage ? this.powerOutage.icon : this.icon;

    return html`
      <div class="circle ${borderCss} ${inactiveCss}">
        ${this._circleMode === ColourMode.Dynamic ? this.renderSegmentedCircle(segmentGroups, circleSize, 270, this.showSegmentGaps) : nothing}
        ${this.renderSecondarySpan(target, this.secondary, states?.gridSecondary, secondaryCss)}
        <ha-icon class="entity-icon ${inactiveCss}" .icon=${icon}></ha-icon>
        ${!isOutage
        ? this.renderEnergyStateSpan(target, exportCss, this.energyUnits, this.firstExportEntity, mdiArrowLeft, exportState, overridePrefix)
        : html`<span class="${CssClass.Grid} power-outage">${localize("common.power_outage")}</span>`}
        ${!isOutage
        ? this.renderEnergyStateSpan(target, importCss, this.energyUnits, this.firstImportEntity, mdiArrowRight, importState, overridePrefix)
        : nothing}
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private static _getHassImportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_from).flatMap(source => source.flow_from!.map(from => from!.stat_energy_from!));
  }

  //================================================================================================================================================================================//

  private static _getHassExportEntities = (energySources: EnergySource[]): string[] => {
    return energySources?.filter(source => source.type === "grid" && source.flow_to).flatMap(source => source.flow_to!.map(to => to!.stat_energy_to!));
  }

  //================================================================================================================================================================================//
}
