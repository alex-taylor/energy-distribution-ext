import { ColoursConfig, NodeOptions, EntitiesOptions, OverridesOptions, isValidPrimaryEntity, EnergyDistributionExtConfig, EditorPages, FlowsOptions, AppearanceOptions, GlobalOptions, SecondaryInfoConfig, SecondaryInfoOptions, EnergyUnitsConfig, EnergyUnitsOptions, DeviceConfig, FlowsConfig, ColourOptions } from "@/config";
import { formatNumber, HomeAssistant } from "custom-card-helpers";
import { SecondaryInfo } from "./secondary-info";
import { DEFAULT_CONFIG, DEFAULT_DEVICE_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { checkEnumValue, CssClass, DeviceClasses, DisplayMode, EnergyUnits, InactiveFlowsMode, Scale, SIUnitPrefixes, UnitPosition, VolumeUnits } from "@/enums";
import { html, LitElement, nothing, svg, TemplateResult } from "lit";
import { localize } from "@/localize/localize";
import Decimal from "decimal.js";
import { Colours } from "./colours";
import { BiDiState, States } from ".";
import { Segment, SegmentGroup } from "@/ui-helpers";
import { CIRCLE_STROKE_WIDTH_SEGMENTS } from "@/const";
import { repeat } from "lit/directives/repeat.js";

//================================================================================================================================================================================//

const INTER_GROUP_ARC: number = 7.5;
const INTER_SEGMENT_ARC: number = INTER_GROUP_ARC / 3;

export type NodeContentRenderFn = ((target: LitElement, circleSize: number, states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes) => TemplateResult) | undefined;

//================================================================================================================================================================================//

export abstract class Node<T> {
  public readonly isPresent: boolean;
  public readonly hassConfigPresent: boolean;
  public readonly importEntities: string[];
  public readonly exportEntities: string[];
  public readonly configEntities: string[];
  public readonly firstImportEntity: string | undefined;
  public readonly firstExportEntity: string | undefined;
  public readonly secondary: SecondaryInfo;
  public readonly cssClass: CssClass;

  public get name(): string {
    return this._name || this.defaultName;
  }
  private _name?: string;

  public get icon(): string {
    return this._icon || this.defaultIcon;
  }
  private _icon?: string;

  protected readonly cardConfigs: EnergyDistributionExtConfig[];
  protected readonly nodeConfigs: T[];
  protected readonly coloursConfigs: ColoursConfig[];
  protected readonly mode: DisplayMode;
  protected readonly inactiveFlowsCss: CssClass;
  protected readonly electricUnits: string;
  protected readonly gasUnits: string;
  protected readonly showSegmentGaps: boolean;
  protected readonly useHassStyles: boolean;
  protected readonly hass: HomeAssistant;
  protected readonly style: CSSStyleDeclaration;

  protected abstract readonly colours: Colours;
  protected abstract readonly defaultName: string;
  protected abstract readonly defaultIcon: string;

  private _showZeroStates: boolean;
  private _clickableEntities: boolean;
  private _energyUnitPosition: UnitPosition;
  private _prefixThreshold: Decimal;
  private _displayPrecisionUnder10: number;
  private _displayPrecisionUnder100: number;
  private _displayPrecision: number;
  private _inactiveFlowsMode: InactiveFlowsMode;
  private _scale: Scale;

  //================================================================================================================================================================================//

  protected constructor(
    hass: HomeAssistant,
    cardConfig: EnergyDistributionExtConfig,
    style: CSSStyleDeclaration,
    node: EditorPages,
    nodeClass: CssClass,
    index: number | undefined = undefined,
    deviceClasses: DeviceClasses[] = [],
    hassImportEntities: string[] = [],
    hassExportEntities: string[] = []) {

    this.hass = hass;
    this.style = style;
    this.cssClass = nodeClass;
    this.cardConfigs = [cardConfig, DEFAULT_CONFIG];
    this.mode = getConfigValue(this.cardConfigs, GlobalOptions.Mode);

    if (index === undefined) {
      this.nodeConfigs = getConfigObjects(this.cardConfigs, node) as T[];
    } else {
      const deviceConfigs: DeviceConfig[] = getConfigValue(this.cardConfigs, node);
      this.nodeConfigs = [deviceConfigs[index], DEFAULT_DEVICE_CONFIG] as T[];
    }

    this.coloursConfigs = getConfigObjects(this.nodeConfigs, NodeOptions.Colours);

    const powerEntities: string[] = getConfigValue(this.nodeConfigs, [NodeOptions.Power_Entities, EntitiesOptions.Entity_Ids]) || [];
    const importEntities: string[] = getConfigValue(this.nodeConfigs, [NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]) || [];
    const exportEntities: string[] = getConfigValue(this.nodeConfigs, [NodeOptions.Export_Entities, EntitiesOptions.Entity_Ids]) || [];

    this.importEntities = this._filterPrimaryEntities(hass, this.mode, [...hassImportEntities, ...importEntities, ...powerEntities], deviceClasses);
    this.exportEntities = this._filterPrimaryEntities(hass, this.mode, [...hassExportEntities, ...exportEntities, ...powerEntities], deviceClasses);
    this.configEntities = [...importEntities, ...exportEntities, ...powerEntities];

    this._name = getConfigValue(this.nodeConfigs, [NodeOptions.Overrides, OverridesOptions.Name]);
    this._icon = getConfigValue(this.nodeConfigs, [NodeOptions.Overrides, OverridesOptions.Icon]);
    this.secondary = new SecondaryInfo(hass, this.mode, getConfigValue(this.nodeConfigs, NodeOptions.Secondary_Info));

    this.isPresent = this.importEntities.length !== 0 || this.exportEntities.length !== 0;
    this.hassConfigPresent = hassImportEntities.length !== 0 || hassExportEntities.length !== 0;
    this.firstImportEntity = this.importEntities.length !== 0 ? this.importEntities[0] : undefined;
    this.firstExportEntity = this.exportEntities.length !== 0 ? this.exportEntities[0] : undefined;

    const flowsConfig: FlowsOptions[] = getConfigObjects(this.cardConfigs, [EditorPages.Appearance, AppearanceOptions.Flows]);

    switch (getConfigValue(flowsConfig, FlowsOptions.Inactive_Flows)) {
      case InactiveFlowsMode.Dimmed:
        this.inactiveFlowsCss = CssClass.Dimmed;
        break;

      case InactiveFlowsMode.Greyed:
        this.inactiveFlowsCss = CssClass.Inactive;
        break;

      default:
        this.inactiveFlowsCss = CssClass.None;
        break;
    }

    const appearanceConfig: AppearanceOptions[] = getConfigObjects(this.cardConfigs, [EditorPages.Appearance, GlobalOptions.Options]);
    this._showZeroStates = getConfigValue(appearanceConfig, AppearanceOptions.Show_Zero_States);
    this.showSegmentGaps = getConfigValue(appearanceConfig, AppearanceOptions.Segment_Gaps);
    this._clickableEntities = getConfigValue(appearanceConfig, AppearanceOptions.Clickable_Entities);
    this.useHassStyles = getConfigValue(appearanceConfig, AppearanceOptions.Use_HASS_Style);

    const flowsConfigs: FlowsConfig[] = getConfigObjects(this.cardConfigs, [EditorPages.Appearance, AppearanceOptions.Flows]);
    this._inactiveFlowsMode = getConfigValue(flowsConfigs, FlowsOptions.Inactive_Flows, value => checkEnumValue(value, InactiveFlowsMode));
    this._scale = getConfigValue(flowsConfigs, FlowsOptions.Scale, value => checkEnumValue(value, Scale));

    const energyUnitsConfig: EnergyUnitsConfig[] = getConfigObjects(this.cardConfigs, [EditorPages.Appearance, AppearanceOptions.Energy_Units]);
    this.electricUnits = this.mode === DisplayMode.Power ? "W" : getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Electric_Units, value => checkEnumValue(value, EnergyUnits));
    this.gasUnits = this.mode === DisplayMode.Power ? "W" : getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Units, value => checkEnumValue(value, VolumeUnits));
    this._energyUnitPosition = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Unit_Position, value => checkEnumValue(value, UnitPosition));
    this._prefixThreshold = new Decimal(getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Prefix_Threshold));
    this._displayPrecisionUnder10 = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Under_10);
    this._displayPrecisionUnder100 = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Under_100);
    this._displayPrecision = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Default);
  }

  //================================================================================================================================================================================//

  public abstract readonly render: NodeContentRenderFn;

  //================================================================================================================================================================================//

  protected renderEnergyStateSpan(target: LitElement, cssClass: string, units: string, entityId?: string, icon?: string, state?: number | null, overridePrefix?: SIUnitPrefixes): TemplateResult {
    if (state === undefined || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const isIdle: boolean = this.mode === DisplayMode.Power && state === 0;

    return html`
      <span class="value ${isIdle ? CssClass.None : cssClass}" @click=${this._handleClick(target, entityId)} @keyDown=${this._handleKeyDown(target, entityId)}>
        <ha-svg-icon class="small ${icon ? "" : "hidden"}" .path=${icon}></ha-svg-icon>
        ${isIdle ? localize("common.idle") : this.renderEnergyState(state, units, overridePrefix)}
      </span>
    `;
  }

  //================================================================================================================================================================================//

  public renderEnergyState(state: number | null, units: string, overridePrefix?: SIUnitPrefixes): string {
    if (state === null || isNaN(state) || state < 0) {
      return localize("common.unknown");
    }

    const getDisplayPrecisionForEnergyState = (state: Decimal): number => state.lessThan(10) ? this._displayPrecisionUnder10 : state.lessThan(100) ? this._displayPrecisionUnder100 : this._displayPrecision;

    let stateAsDecimal: Decimal = new Decimal(state);

    if (!overridePrefix) {
      overridePrefix = this._calculateEnergyUnitPrefix(stateAsDecimal);
    }

    const prefixes: string[] = Object.values(SIUnitPrefixes);
    const divisor: number = 1000 ** prefixes.indexOf(overridePrefix);
    stateAsDecimal = stateAsDecimal.dividedBy(divisor);
    const decimals: number = getDisplayPrecisionForEnergyState(stateAsDecimal);
    const formattedValue = formatNumber(stateAsDecimal.toDecimalPlaces(decimals).toString(), this.hass.locale);
    return this._formatState(formattedValue, overridePrefix + units, this._energyUnitPosition);
  }

  //================================================================================================================================================================================//

  protected renderSecondarySpan(target: LitElement, secondary: SecondaryInfo, state: number | undefined = undefined, cssClass: string): TemplateResult {
    if (!secondary.isPresent || state === undefined || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const entityId: string = secondary.entity!;

    return html`
      <span class="secondary-info ${cssClass}" @click=${this._handleClick(target, entityId)} @keyDown=${(this._handleKeyDown(target, entityId))}>
        ${secondary.icon ? html`<ha-icon class="secondary-info small ${cssClass}" .icon=${secondary.icon}></ha-icon>` : nothing}
        ${this._renderSecondaryState(secondary.config, entityId, state)}
      </span>
    `;
  };

  //================================================================================================================================================================================//

  protected setCssVariables(style: CSSStyleDeclaration, state: BiDiState = { import: 0, export: 0 }): void {
    style.setProperty(`--circle-${this.cssClass}-color`, this.colours.getColour(ColourOptions.Circle, state));
    style.setProperty(`--icon-${this.cssClass}-color`, this.colours.getColour(ColourOptions.Icon, state));
    style.setProperty(`--importValue-${this.cssClass}-color`, this.colours.getColour(ColourOptions.Value_Import, state));
    style.setProperty(`--exportValue-${this.cssClass}-color`, this.colours.getColour(ColourOptions.Value_Export, state));
    style.setProperty(`--secondary-${this.cssClass}-color`, this.colours.getColour(ColourOptions.Secondary, state));
  }

  //================================================================================================================================================================================//

  private _renderSecondaryState(config: SecondaryInfoConfig[], entityId: string, state: number): string {
    if (state === null || isNaN(state)) {
      return localize("common.unknown");
    }

    const deviceClass: string | undefined = this.hass.states[entityId].attributes.device_class;

    if (deviceClass === DeviceClasses.Energy) {
      return this.renderEnergyState(state, this.electricUnits);
    }

    const units: string | undefined = this.hass.states[entityId].attributes.unit_of_measurement;
    const decimals: number = getConfigValue(config, SecondaryInfoOptions.Display_Precision) ?? this.hass["entities"][entityId].display_precision;
    const isCurrencyEntity: boolean = deviceClass === DeviceClasses.Monetary;
    let formattedValue: string;

    if (isCurrencyEntity) {
      formattedValue = formatNumber(new Decimal(state).toFixed(decimals), this.hass.locale);
    } else {
      formattedValue = formatNumber(new Decimal(state).toDecimalPlaces(decimals).toString(), this.hass.locale);
    }

    return this._formatState(formattedValue, units, getConfigValue(config, SecondaryInfoOptions.Unit_Position));
  }

  //================================================================================================================================================================================//

  protected renderSegmentedCircle(segmentGroups: SegmentGroup[], size: number, startingAngle: number, interSegmentGaps: boolean): TemplateResult {
    const centre: number = size / 2;
    const radius: number = (size - CIRCLE_STROKE_WIDTH_SEGMENTS) / 2;
    const circumference: number = 2 * radius * Math.PI;

    const interGroupArc: number = segmentGroups.length > 1 ? INTER_GROUP_ARC : 0;
    const interGroupLength: number = circumference * interGroupArc / 360;

    const interSegmentArc: number = interSegmentGaps ? INTER_SEGMENT_ARC : 0;
    const interSegmentLength: number = circumference * interSegmentArc / 360;

    const groupArc: number = 360 / segmentGroups.length - interGroupArc;
    const groupLength: number = circumference * groupArc / 360;

    const startingOffset: number = circumference * -(startingAngle + interGroupArc / 2) / 360;
    let offset: number = startingOffset;
    let length: number = 0;

    return html`
    <svg>
    ${repeat(
      segmentGroups,
      _ => undefined,
      (_, groupIdx) => {
        const group: SegmentGroup = segmentGroups[groupIdx];
        let activeSegments: number = 0;
        let stateTotal: number = 0;

        group.segments.forEach(segment => {
          if (segment.state > 0) {
            stateTotal += this._scale === Scale.Linear ? segment.state : Math.log(segment.state);
            activeSegments++;
          }
        });

        if (activeSegments === 0) {
          let cssFlow: string = group.inactiveCss;

          switch (this._inactiveFlowsMode) {
            case InactiveFlowsMode.Dimmed:
              cssFlow += " " + CssClass.Dimmed;
              break;

            case InactiveFlowsMode.Greyed:
              cssFlow = CssClass.Inactive;
              break;
          }

          return svg`
          <circle
            class="${cssFlow}"
            cx = "${centre}"
            cy = "${centre}"
            r = "${radius}"
            stroke-dasharray="${groupLength} ${circumference - groupLength}"
            stroke-dashoffset="${(groupIdx + 1) * (groupLength + interGroupLength) - circumference + startingOffset}"
            shape-rendering="geometricPrecision"
          />
        `;
        }

        const totalSegmentLengths: number = groupLength - (activeSegments === 1 ? 0 : (activeSegments - (segmentGroups.length === 1 ? 0 : 1)) * interSegmentLength);
        let segmentToRender: number = 0;

        return html`
        ${repeat(
          group.segments,
          _ => undefined,
          (_, segmentIdx) => {
            const segment: Segment = group.segments[segmentIdx];

            if (segmentIdx === 0) {
              offset = groupIdx * (groupLength + interGroupLength) + startingOffset + interGroupLength;
            }

            if (segment.state === 0) {
              return ``;
            }

            const interSegmentGap: number = segmentToRender++ > 0 || segmentGroups.length === 1 ? interSegmentLength : 0;
            length = (this._scale === Scale.Linear ? segment.state : Math.log(segment.state)) / stateTotal * totalSegmentLengths;
            offset += interSegmentGap + length;

            return svg`
          <circle
            class="${segment.cssClass}"
            cx = "${centre}"
            cy = "${centre}"
            r = "${radius}"
            stroke-dasharray="${length} ${circumference - length}"
            stroke-dashoffset="${offset - circumference}"
            shape-rendering="geometricPrecision"
          />
          `;
          }
        )}
      `;
      }
    )}
    </svg>
  `;
  }

  //================================================================================================================================================================================//

  private _handleKeyDown(target: LitElement, entityId?: string): any {
    if (!entityId) {
      return undefined;
    }

    return (e: { key: string; stopPropagation: () => void }) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        this._openDetails(target, e, entityId);
      }
    };
  };

  //================================================================================================================================================================================//

  private _handleClick(target: LitElement, entityId?: string): any {
    if (!entityId) {
      return undefined;
    }

    return (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      this._openDetails(target, e, entityId);
    };
  };

  //================================================================================================================================================================================//

  private _openDetails(target: LitElement, event: { stopPropagation: any; key?: string }, entityId?: string): void {
    event.stopPropagation();

    if (!entityId || !this._clickableEntities) {
      return;
    }

    if (!(entityId in this.hass.states)) {
      return;
    }

    const e: CustomEvent = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });

    target.dispatchEvent(e);
  };

  //================================================================================================================================================================================//

  private _calculateEnergyUnitPrefix(value: Decimal): SIUnitPrefixes {
    const prefixes: SIUnitPrefixes[] = Object.values(SIUnitPrefixes);

    value = value.abs();

    for (let n: number = 0; n < prefixes.length; n++) {
      if (value.lessThan(this._prefixThreshold)) {
        return prefixes[n];
      }

      value = value.dividedBy(1000);
    }

    return prefixes[prefixes.length - 1];
  }

  //================================================================================================================================================================================//

  private _filterPrimaryEntities(hass: HomeAssistant, mode: DisplayMode, entityIds: string[], deviceClasses: DeviceClasses[]): string[] {
    return [...new Set(entityIds.filter(entityId => isValidPrimaryEntity(hass, mode, entityId, deviceClasses)))];
  }

  //================================================================================================================================================================================//

  private _formatState(state: string, units?: string, unitPosition: UnitPosition = UnitPosition.After_Space): string {
    switch (unitPosition) {
      case UnitPosition.After_Space:
        return `${state} ${units}`;

      case UnitPosition.Before_Space:
        return `${units} ${state}`;

      case UnitPosition.After:
        return `${state}${units}`;

      case UnitPosition.Before:
        return `${units}${state}`;
    }

    return `${state}`;
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//
