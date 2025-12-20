import { CSSResult, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { formatNumber, HomeAssistant } from "custom-card-helpers";
import { Decimal } from "decimal.js";
import { customElement, property, state } from "lit/decorators.js";
import { getDefaultConfig, cleanupConfig } from "@/config/config";
import { SubscribeMixin } from "@/energy/subscribe-mixin";
import { localize } from "@/localize/localize";
import { styles } from "@/style";
import { BatteryState } from "@/states/battery";
import { GridState } from "@/states/grid";
import { SolarState } from "@/states/solar";
import { SecondaryInfoState } from "@/states/secondary-info";
import { States, Flows } from "@/states";
import { EntityStates } from "@/states/entity-states";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { ColourMode, DisplayMode, DotsMode, LowCarbonType, DefaultValues, UnitPosition, UnitPrefixes, CssClass, EnergyUnits, InactiveFlowsMode } from "@/enums";
import { HomeState } from "@/states/home";
import { SingleValueState, ValueState } from "@/states/state";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, CIRCLE_RADIUS, CIRCLE_SIZE, COL_SPACING, DEVICE_CLASS_ENERGY, DEVICE_CLASS_MONETARY, DOT_DIAMETER, FLOW_LINE_CURVED, FLOW_LINE_CURVED_CONTROL, FLOW_LINE_SPACING, ROW_SPACING } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, EntitiesOptions, GlobalOptions, FlowsOptions, ColourOptions, EnergyUnitsOptions, PowerOutageOptions, EntityOptions, EnergyUnitsConfig, SecondaryInfoConfig, BatteryConfig, GridConfig, FlowsConfig } from "@/config";
import { setDualValueNodeDynamicStyles, setDualValueNodeStaticStyles, setHomeNodeDynamicStyles, setHomeNodeStaticStyles, setSingleValueNodeStyles } from "@/ui-helpers/styles";
import { renderFlowLines, renderSegmentedCircle } from "@/ui-helpers/renderers";
import { AnimSpeeds, FlowLine, SegmentGroup } from "@/ui-helpers";
import { LowCarbonState } from "@/states/low-carbon";

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
}

function registerCustomCard(params: RegisterCardParams) {
  const windowWithCards = window as unknown as Window & {
    customCards: unknown[];
  };

  windowWithCards.customCards = windowWithCards.customCards || [];

  windowWithCards.customCards.push({
    ...params,
    preview: true,
    documentationURL: `https://github.com/alex-taylor/energy-flow-card-plus`,
  });
}

registerCustomCard({
  type: CARD_NAME,
  name: "Energy Flow Card Extended",
  description: "A custom card for displaying energy flow in Home Assistant. Inspired by the official Energy Distribution Card and Energy Flow Card Plus.",
});

const NODE_SPACER: TemplateResult = html`<div class="node-spacer"></div>`;
const HORIZ_SPACER: TemplateResult = html`<div class="horiz-spacer"></div>`;

//================================================================================================================================================================================//

@customElement(CARD_NAME)
export default class EnergyFlowCardPlus extends SubscribeMixin(LitElement) {
  static styles: CSSResult = styles;

  //================================================================================================================================================================================//

  public static getStubConfig(hass: HomeAssistant): Record<string, unknown> {
    return getDefaultConfig(hass);
  }

  //================================================================================================================================================================================//

  public static async getConfigElement(): Promise<HTMLElement> {
    await import("@/ui-editor/ui-editor");
    return document.createElement(EDITOR_ELEMENT_NAME);
  }

  //================================================================================================================================================================================//

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: EnergyFlowCardExtConfig;
  @state() private _loading: boolean = false;

  private _width: number = 0;
  private _gridToHomePath: string = "";
  private _solarToBatteryPath: string = "";
  private _solarToHomePath: string = "";
  private _solarToGridPath: string = "";
  private _batteryToHomePath: string = "";
  private _batteryToGridPath: string = "";
  private _gridToBatteryPath: string = "";
  private _gasToHomePath: string = "";
  private _lowCarbonToGridPath: string = "";

  private _entityStates!: EntityStates;
  private _kiloToMegaThreshold!: Decimal;
  private _wattToKiloThreshold!: Decimal;
  private _displayPrecisionUnder10: number = DefaultValues.DisplayPrecisionUnder10;
  private _displayPrecisionUnder100: number = DefaultValues.DisplayPrecisionUnder100;
  private _displayPrecision: number = DefaultValues.DisplayPrecision;
  private _energyUnitPrefixes!: UnitPrefixes;
  private _energyUnitPosition!: UnitPosition;
  private _showZeroStates: boolean = true;
  private _showSegmentGaps: boolean = false;
  private _useHassColours: boolean = true;
  private _lowCarbonAsPercentage: boolean = true;
  private _inactiveFlowsCss: string = CssClass.Inactive;

  //================================================================================================================================================================================//

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (!this._config || !this.hass) {
      return;
    }

    this._entityStates.hass = this.hass;
  }

  //================================================================================================================================================================================//

  public hassSubscribe(): Promise<UnsubscribeFunc>[] {
    this._entityStates = new EntityStates(this.hass, this._config);
    return [this._entityStates.subscribe(this._config)];
  }

  //================================================================================================================================================================================//

  public setConfig(config: EnergyFlowCardExtConfig): void {
    if (typeof config !== "object") {
      throw new Error(localize("common.invalid_configuration"));
    }

    if (!config?.[EditorPages.Battery]?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids]?.length &&
      !config?.[EditorPages.Battery]?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids]?.length &&
      !config?.[EditorPages.Grid]?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids]?.length &&
      !config?.[EditorPages.Grid]?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids]?.length &&
      !config?.[EditorPages.Solar]?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids]?.length &&
      !config?.[EditorPages.Gas]?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids]?.length) {
      // TODO: this might not be entirely true once devices are present
      throw new Error("At least one entity for battery, gas, grid or solar must be defined");
    }

    this._config = cleanupConfig(this.hass, config);
    this.resetSubscriptions();

    this._showZeroStates = this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Show_Zero_States] ?? true;
    this._showSegmentGaps = this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Segment_Gaps] ?? false;
    this._useHassColours = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Use_HASS_Colours] ?? true;
    this._lowCarbonAsPercentage = this._config?.[EditorPages.Low_Carbon]?.[GlobalOptions.Options]?.[EntitiesOptions.Low_Carbon_Mode] === LowCarbonType.Percentage;

    switch (this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Inactive_Flows] || InactiveFlowsMode.Normal) {
      case InactiveFlowsMode.Dimmed:
        this._inactiveFlowsCss = CssClass.Dimmed;
        break;

      case InactiveFlowsMode.Greyed:
        this._inactiveFlowsCss = CssClass.Inactive;
        break;

      default:
        this._inactiveFlowsCss = "";
        break;
    }

    const energyUnitsConfig: EnergyUnitsConfig = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Energy_Units]!;
    this._energyUnitPrefixes = energyUnitsConfig?.[EnergyUnitsOptions.Unit_Prefixes] || UnitPrefixes.Unified;
    this._energyUnitPosition = energyUnitsConfig?.[EnergyUnitsOptions.Unit_Position] || UnitPosition.After_Space;
    this._kiloToMegaThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Kwh_Mwh_Threshold] || DefaultValues.KwhMwhThreshold);
    this._wattToKiloThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Wh_Kwh_Threshold] || DefaultValues.WhkWhThreshold);
    this._displayPrecisionUnder10 = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Under_10] ?? DefaultValues.DisplayPrecisionUnder10;
    this._displayPrecisionUnder100 = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Under_100] ?? DefaultValues.DisplayPrecisionUnder100;
    this._displayPrecision = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Default] ?? DefaultValues.DisplayPrecision;

    setSingleValueNodeStyles(this._config?.[EditorPages.Low_Carbon]!, CssClass.LowCarbon, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Solar]!, CssClass.Solar, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Gas]!, CssClass.Gas, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Grid]!, CssClass.Grid, this.style);
    setHomeNodeStaticStyles(this._config?.[EditorPages.Home]!, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Battery]!, CssClass.Battery, this.style);

    this.style.setProperty("--clickable-cursor", this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Clickable_Entities] ? "pointer" : "default");
    this.style.setProperty("--inactive-path-color", this._useHassColours && this._inactiveFlowsCss !== CssClass.Inactive ? "var(--primary-text-color)" : "var(--disabled-text-color)");
  }

  //================================================================================================================================================================================//

  protected render(): TemplateResult {
    if (!this._config || !this.hass || !this._entityStates) {
      return html``;
    }

    if (this._loading) {
      return html`<ha-card style="padding: 2rem">${this.hass.localize("ui.panel.lovelace.cards.energy.loading")}</ha-card>`;
    }

    if (!this._entityStates.isDatePickerPresent && this._config?.[GlobalOptions.Display_Mode] !== DisplayMode.Today) {
      return html`
        <ha-card style="padding: 2rem">
          ${this.hass.localize("ui.panel.lovelace.cards.energy.loading")}<br/>
          Make sure you have the Energy Integration set up and a Date Selector in this View or set <pre>display_mode: today</pre>
        </ha-card>`;
    }

    this._calculateFlowLines();

    const states: States = this._entityStates.getStates();
    const electricUnits: string | undefined = this._energyUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnits(new Decimal(states.largestElectricValue)) : undefined;
    const animSpeeds: AnimSpeeds = this._calculateAnimationSpeeds(states);

    return html`
      <ha-card .header=${this._config?.[GlobalOptions.Title]}>
        <div class="card-content" id=${CARD_NAME}>

        <!-- flow lines -->
        ${this._renderFlowLines(states, animSpeeds)}

        <!-- top row -->
        <div class="row">

          <!-- top left -->
          ${this._renderLowCarbonNode(this._entityStates.lowCarbon, states, this._lowCarbonAsPercentage ? states.lowCarbonPercentage : states.lowCarbon, states.lowCarbonSecondary, this._lowCarbonAsPercentage ? "%" : electricUnits)}

          ${HORIZ_SPACER}

          <!-- top centre -->
          ${this._renderTopRowNode(this._entityStates.solar, CssClass.Solar, states.solarImport, states.solarSecondary, electricUnits)}

          ${HORIZ_SPACER}

          <!-- top right -->
          ${this._renderTopRowNode(this._entityStates.gas, CssClass.Gas, states.gasImport, states.gasSecondary)}

        </div>

        <!-- middle row -->
        <div class="row">

          <!-- middle left -->
          ${this._renderGridNode(states, electricUnits)}

          ${HORIZ_SPACER}

          <!-- middle centre -->
          ${NODE_SPACER}

          ${HORIZ_SPACER}

          <!-- middle right -->
          ${this._renderHomeNode(states, electricUnits)}

        </div>

        <!-- bottom row -->
        <div class="row">

          <!-- bottom left -->
          ${NODE_SPACER}

          ${HORIZ_SPACER}

          <!-- bottom centre -->
          ${this._renderBatteryNode(states, electricUnits)}

          ${HORIZ_SPACER}

          <!-- bottom right -->
          ${NODE_SPACER}

        </div>

      </div>

      <!-- dashboard link -->
      ${this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Dashboard_Link]
        ? html`
          <div class="card-actions">
            <a href=${this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Dashboard_Link]}>
              <mwc-button>
                ${this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Dashboard_Link_Label] || this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
              </mwc-button>
            </a>
          </div>
        `
        : ""}
      </ha-card>
    `;
  }

  //================================================================================================================================================================================//

  private _renderLowCarbonNode(state: LowCarbonState, states: States, primaryState: number, secondaryState: number, energyUnits: string | undefined = undefined): TemplateResult {
    if (!this._entityStates.grid.isPresent || !state.isPresent) {
      return NODE_SPACER;
    }

    if (states.gridImport === 0) {
      primaryState = 0;
    }

    const inactiveCss: string = primaryState === 0 ? this._inactiveFlowsCss : "";

    return html`
      <div class="node top-row ${CssClass.LowCarbon}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${this._renderSecondarySpan(state.secondary, secondaryState, inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.LowCarbon + " " + inactiveCss, state.firstImportEntity, undefined, primaryState, energyUnits)}
          </div>
        </div>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderTopRowNode(state: SingleValueState, cssClass: CssClass, primaryState: number, secondaryState: number, energyUnits: string | undefined = undefined): TemplateResult {
    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const inactiveCss: string = primaryState === 0 ? this._inactiveFlowsCss : "";

    return html`
      <div class="node top-row ${cssClass}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${this._renderSecondarySpan(state.secondary, secondaryState, inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(cssClass + " " + inactiveCss, state.firstImportEntity, undefined, primaryState, energyUnits)}
          </div>
        </div>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderBatteryNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: BatteryState = this._entityStates.battery;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const flows: Flows = states.flows;
    const highCarbon: number = 1 - (states.lowCarbonPercentage / 100);
    let mainEntityId: string = "";
    const segmentGroups: SegmentGroup[] = [];

    if (state.firstExportEntity) {
      mainEntityId = state.firstExportEntity;

      segmentGroups.push(
        {
          inactiveCss: CssClass.BatteryExport,
          segments: [
            {
              state: flows.gridToBattery * highCarbon || 0,
              cssClass: CssClass.GridImport
            },
            {
              state: flows.gridToBattery * (1 - highCarbon) || 0,
              cssClass: CssClass.LowCarbon
            },
            {
              state: flows.solarToBattery || 0,
              cssClass: CssClass.Solar
            }
          ]
        }
      );
    }

    if (state.firstImportEntity) {
      mainEntityId = state.firstImportEntity;

      segmentGroups.push(
        {
          inactiveCss: CssClass.BatteryImport,
          segments: [
            {
              state: flows.batteryToHome || 0,
              cssClass: CssClass.BatteryImport
            },
            {
              state: flows.batteryToGrid || 0,
              cssClass: CssClass.GridExport
            }
          ]
        }
      );
    }

    const config: BatteryConfig = this._config[EditorPages.Battery]!;
    const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]!;
    setDualValueNodeDynamicStyles(config, CssClass.Battery, states.batteryExport, states.batteryImport, this.style);

    const inactiveCss: string = states.batteryExport === 0 && states.batteryImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssImport: string = states.batteryImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssExport: string = states.batteryExport === 0 ? this._inactiveFlowsCss : "";
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.HiddenCircle : "";

    return html`
      <div class="node bottom-row ${CssClass.Battery}">
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}" @click=${this._handleClick(mainEntityId)} @keyDown=${this._handleKeyDown(mainEntityId)}>
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, CIRCLE_RADIUS, 180, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(state.secondary, states.batterySecondary, inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.BatteryExport + " " + inactiveCssExport, state.firstExportEntity, "mdi:arrow-down", states.batteryExport, energyUnits)}
            ${this._renderEnergyStateSpan(CssClass.BatteryImport + " " + inactiveCssImport, state.firstImportEntity, "mdi:arrow-up", states.batteryImport, energyUnits)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderGridNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    // TODO: power outage

    const state: GridState = this._entityStates.grid;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const flows: Flows = states.flows;
    let mainEntityId: string = "";
    const segmentGroups: SegmentGroup[] = [];

    if (state.firstExportEntity) {
      mainEntityId = state.firstExportEntity;

      segmentGroups.push(
        {
          inactiveCss: CssClass.GridExport,
          segments: [
            {
              state: flows.solarToGrid || 0,
              cssClass: CssClass.Solar
            },
            {
              state: flows.batteryToGrid || 0,
              cssClass: CssClass.BatteryImport
            }
          ]
        }
      );
    }

    if (state.firstImportEntity) {
      mainEntityId = state.firstImportEntity;

      segmentGroups.push(
        {
          inactiveCss: CssClass.GridImport,
          segments: [
            {
              state: flows.gridToBattery || 0,
              cssClass: CssClass.BatteryExport
            },
            {
              state: flows.gridToHome || 0,
              cssClass: CssClass.GridImport
            }
          ]
        }
      );
    }

    const config: GridConfig = this._config[EditorPages.Grid]!;
    const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]!;
    setDualValueNodeDynamicStyles(config, CssClass.Grid, states.gridExport, states.gridImport, this.style);

    const inactiveCss: string = states.gridExport === 0 && states.gridImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssImport: string = states.gridImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssExport: string = states.gridExport === 0 ? this._inactiveFlowsCss : "";
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.HiddenCircle : "";

    return html`
      <div class="node ${CssClass.Grid}">
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}" @click=${this._handleClick(mainEntityId)} @keyDown=${this._handleKeyDown(mainEntityId)}>
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, CIRCLE_RADIUS, 270, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(this._entityStates.grid.secondary, states.gridSecondary, inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.GridExport + " " + inactiveCssExport, state.firstExportEntity, "mdi:arrow-left", states.gridExport, energyUnits)}
            ${this._renderEnergyStateSpan(CssClass.GridImport + " " + inactiveCssImport, state.firstImportEntity, "mdi:arrow-right", states.gridImport, energyUnits)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderHomeNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: HomeState = this._entityStates.home;
    setHomeNodeDynamicStyles(this._config?.[EditorPages.Home]!, states, this.style);

    const flows: Flows = states.flows;
    const highCarbonConsumption: number = states.highCarbon * (flows.gridToHome / states.gridImport) || 0;
    const lowCarbonConsumption: number = states.lowCarbon * (flows.gridToHome / states.gridImport) || 0;

    const segmentGroups: SegmentGroup[] = [
      {
        inactiveCss: this._useHassColours ? CssClass.GridImport : CssClass.Inactive,
        segments: [
          {
            state: flows.solarToHome || 0,
            cssClass: CssClass.Solar
          },
          {
            state: flows.batteryToHome || 0,
            cssClass: CssClass.Battery
          },
          {
            state: lowCarbonConsumption || 0,
            cssClass: CssClass.LowCarbon
          },
          {
            state: highCarbonConsumption || 0,
            cssClass: this._useHassColours ? CssClass.GridImport : CssClass.Grid
          }
        ]
      }
    ];

    const inactiveCss: string = states.flows.batteryToHome === 0 && states.flows.gridToHome === 0 && states.flows.solarToHome === 0 ? this._inactiveFlowsCss : "";

    return html`
      <div class="node ${CssClass.Home}">
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}>
            ${renderSegmentedCircle(this._config, segmentGroups, CIRCLE_RADIUS, 0, this._showSegmentGaps)}
            ${this._renderSecondarySpan(state.secondary, states.homeSecondary, inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.Home + " " + inactiveCss, state.firstImportEntity, undefined, states.home, energyUnits)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderEnergyStateSpan = (cssClass: string, entityId: string | undefined, icon: string | undefined, state: number, energyUnits: string | undefined): TemplateResult => {
    if ((!entityId && !cssClass.includes(CssClass.Home)) || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    return html`
      <span class="${cssClass}" @click=${this._handleClick(entityId)} @keyDown=${this._handleKeyDown(entityId)}>
        ${icon ? html`<ha-icon class="small" .icon=${icon}></ha-icon>` : ""}
        ${this._renderEnergyState(state, energyUnits)}
      </span>
    `;
  }

//================================================================================================================================================================================//

  private _calculateDotRate = (value: number, total: number): number => {
    const flowsConfig: FlowsConfig | undefined = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows];

    if (flowsConfig?.[FlowsOptions.Animation] === DotsMode.HASS) {
      return DefaultValues.MaxRate - (value / total) * (DefaultValues.MaxRate - DefaultValues.MinRate);
    }

    const maxRate = flowsConfig?.[FlowsOptions.Max_Rate] || DefaultValues.MaxRate;
    const minRate = flowsConfig?.[FlowsOptions.Min_Rate] || DefaultValues.MinRate;

    const maxEnergy: number = flowsConfig?.[FlowsOptions.Max_Energy] || DefaultValues.MaxEnergy;
    const minEnergy: number = flowsConfig?.[FlowsOptions.Min_Energy] || DefaultValues.MinEnergy;

    if (value > maxEnergy) {
      return minRate;
    }

    return ((value - minEnergy) * (minRate - maxRate)) / (maxEnergy - minEnergy) + maxRate;
  };

  //================================================================================================================================================================================//

  private _calculateEnergyUnits(value: Decimal): EnergyUnits {
    if (value.abs().dividedBy(1000).greaterThanOrEqualTo(this._kiloToMegaThreshold)) {
      return EnergyUnits.MegaWattHours;
    }

    if (value.abs().greaterThanOrEqualTo(this._wattToKiloThreshold)) {
      return EnergyUnits.KiloWattHours;
    }

    return EnergyUnits.WattHours;
  }

  //================================================================================================================================================================================//

  private _formatState(state: string, units: string | undefined, unitPosition: UnitPosition | undefined = UnitPosition.After_Space): string {
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

  private _renderEnergyState(state: number, units: string | undefined = undefined): string {
    if (state === null || state < 0) {
      return localize("editor.unknown");
    }

    const getDisplayPrecisionForEnergyState = (state: Decimal): number => state.lessThan(10) ? this._displayPrecisionUnder10 : state.lessThan(100) ? this._displayPrecisionUnder100 : this._displayPrecision;

    let stateAsDecimal = new Decimal(state);
    let decimals: number;

    if (!units) {
      units = this._calculateEnergyUnits(stateAsDecimal);
    }

    switch (units) {
      case EnergyUnits.MegaWattHours:
        stateAsDecimal = stateAsDecimal.dividedBy(1000000);
        break;

      case EnergyUnits.KiloWattHours:
        stateAsDecimal = stateAsDecimal.dividedBy(1000);
        break;
    }

    decimals = getDisplayPrecisionForEnergyState(stateAsDecimal);

    const formattedValue = formatNumber(stateAsDecimal.toDecimalPlaces(decimals).toString(), this.hass.locale);
    return this._formatState(formattedValue, units, this._energyUnitPosition);
  }

  //================================================================================================================================================================================//

  private _renderState(config: SecondaryInfoConfig, entityId: string, state: number, deviceClass: string | undefined = undefined): string {
    if (state === null) {
      return localize("editor.unknown");
    }

    const isEnergyDevice: boolean = (deviceClass ?? this.hass.states[entityId].attributes.device_class) === DEVICE_CLASS_ENERGY;
    let units: string | undefined = config?.[EntityOptions.Units] ?? this.hass.states[entityId].attributes.unit_of_measurement;

    if (isEnergyDevice) {
      return this._renderEnergyState(state, units);
    }

    const isCurrencyDevice: boolean = (deviceClass ?? this.hass.states[entityId].attributes.device_class) === DEVICE_CLASS_MONETARY;
    const decimals: number = config?.[EntityOptions.Display_Precision] ?? this.hass["entities"][entityId].display_precision;
    let formattedValue: string;

    if (isCurrencyDevice) {
      formattedValue = formatNumber(new Decimal(state).toFixed(decimals), this.hass.locale);
    } else {
      formattedValue = formatNumber(new Decimal(state).toDecimalPlaces(decimals).toString(), this.hass.locale);
    }

    return this._formatState(formattedValue, units, config?.[EntityOptions.Unit_Position]);
  }

  //================================================================================================================================================================================//

  private _handleKeyDown = (target: string | undefined) => {
    if (!target) {
      return undefined;
    }

    return (e: { key: string; stopPropagation: () => void }) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        this._openDetails(e, target);
      }
    };

  };

  //================================================================================================================================================================================//

  private _handleClick = (target: string | undefined) => {
    if (!target) {
      return undefined;
    }

    return (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      this._openDetails(e, target);
    };
  };

  //================================================================================================================================================================================//

  private _openDetails = (event: { stopPropagation: any; key?: string }, entityId?: string | undefined): void => {
    event.stopPropagation();

    if (!entityId || !this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Clickable_Entities]) {
      return;
    }

    // TODO also needs to open details if entity is unavailable, but not if entity doesn't exist in hass states
    if (!(entityId in this.hass.states)) {
      return;
    }

    const e = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });

    this.dispatchEvent(e);
  };

  //================================================================================================================================================================================//

  private _renderSecondarySpan(secondary: SecondaryInfoState, state: number, inactiveCss: string): TemplateResult {
    if (!secondary.isPresent || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const entityId: string = secondary.firstImportEntity!;

    state = Math.abs(state) < (secondary.config?.[EntityOptions.Zero_Threshold] ?? 0)
      ? 0
      : state;

    return html`
        <span class="secondary-info ${inactiveCss}" @click=${this._handleClick(entityId)} @keyDown=${(this._handleKeyDown(entityId))}>
          ${secondary.icon ? html`<ha-icon class="secondary-info small ${inactiveCss}" .icon=${secondary.icon}></ha-icon>` : ""}
          ${this._renderState(secondary.config!, entityId, state)}
        </span>
      `;
  };

  //================================================================================================================================================================================//

  private _renderGridCircle2(gridToGrid: number, gridFromGrid: number, secondaryState: number, energyUnits: string | undefined): TemplateResult {
    if (!this._entityStates.grid.isPresent) {
      return html`<div class="spacer"></div>`;
    }

    const gridIcon: string =
      this._entityStates.grid.powerOutage.isOutage
        ? this._config?.[EditorPages.Grid]?.[PowerOutageOptions.Power_Outage]?.[PowerOutageOptions.Icon_Alert] ?? "mdi:transmission-tower-off"
        : this._entityStates.grid.icon;

    return html`
        <div class="node grid">
          <div class="circle" @click=${this._handleClick(this._entityStates.grid.firstImportEntity)} @keyDown=${this._handleKeyDown(this._entityStates.grid.firstImportEntity)}>
          ${this._renderSecondarySpan(this._entityStates.grid.secondary, secondaryState, "")}
          <ha-icon class="entity-icon" .icon=${gridIcon}></ha-icon>
          ${!this._entityStates.grid.powerOutage.isOutage && (this._showZeroStates || gridToGrid !== 0)
        ? html`
            <span class="return" @click=${this._handleClick(this._entityStates.grid.firstExportEntity)} @keyDown=${this._handleKeyDown(this._entityStates.grid.firstExportEntity)}>
              <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>
              ${this._renderEnergyState(gridToGrid, energyUnits)}
            </span>
            `
        : ``}
            ${!this._entityStates.grid.powerOutage.isOutage && (this._showZeroStates || gridFromGrid !== 0)
        ? html`
            <span class="consumption">
              <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>
              ${this._renderEnergyState(gridFromGrid, energyUnits)}
            </span>`
        : ``}
            ${this._entityStates.grid.powerOutage.isOutage
        ? html`
            <span style="padding-top: 2px;" class="grid power-outage">${this._config?.[EditorPages.Grid]?.[PowerOutageOptions.Power_Outage]?.[PowerOutageOptions.Label_Alert] || html`Power<br/>Outage`}</span>`
        : ``}
          </div>
          <span class="label">${this._entityStates.grid.name}</span>
        </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderFlowLines = (states: States, animSpeeds: AnimSpeeds): TemplateResult => {
    const entityStates: EntityStates = this._entityStates;
    const grid: GridState = entityStates.grid;
    const battery: BatteryState = entityStates.battery;
    const solar: SolarState = entityStates.solar;
    const flows: Flows = states.flows;
    const lines: FlowLine[] = [];

    if (solar.isPresent) {
      lines.push({
        cssLine: CssClass.Solar,
        cssDot: CssClass.Solar,
        path: this._solarToHomePath,
        active: flows.solarToHome > 0,
        animDuration: animSpeeds.solarToHome
      });
    }

    if (solar.isPresent && grid.firstExportEntity) {
      lines.push({
        cssLine: CssClass.GridExport,
        cssDot: CssClass.GridExport,
        path: this._solarToGridPath,
        active: flows.solarToGrid > 0,
        animDuration: animSpeeds.solarToGrid
      });
    }

    if (solar.isPresent && battery.firstExportEntity) {
      lines.push({
        cssLine: CssClass.BatteryExport,
        cssDot: CssClass.BatteryExport,
        path: this._solarToBatteryPath,
        active: flows.solarToBattery > 0,
        animDuration: animSpeeds.solarToBattery
      });
    }

    if (grid.firstImportEntity) {
      lines.push({
        cssLine: CssClass.GridImport,
        cssDot: CssClass.GridImport,
        path: this._gridToHomePath,
        active: flows.gridToHome > 0,
        animDuration: animSpeeds.gridToHome
      });
    }

    if (battery.firstImportEntity) {
      lines.push({
        cssLine: CssClass.BatteryImport,
        cssDot: CssClass.BatteryImport,
        path: this._batteryToHomePath,
        active: flows.batteryToHome > 0,
        animDuration: animSpeeds.batteryToHome
      });
    }

    if (battery.isPresent && grid.isPresent) {
      const gridToBatteryActive: boolean = flows.gridToBattery > 0;
      const batteryToGridActive: boolean = flows.batteryToGrid > 0;

      let cssGridToBattery: string | undefined = undefined;
      let cssBatteryToGrid: string | undefined = undefined;
      let cssGridToBatteryDot: string = CssClass.BatteryExport;

      if (this._useHassColours) {
        if (!gridToBatteryActive && !batteryToGridActive) {
          cssGridToBattery = CssClass.Inactive;
        } else {
          cssGridToBattery = cssBatteryToGrid = batteryToGridActive ? CssClass.GridExport : CssClass.GridImport;
          cssGridToBatteryDot = CssClass.GridImport;
        }
      } else {
        if (!gridToBatteryActive && batteryToGridActive) {
          cssBatteryToGrid = CssClass.GridExport;
        } else if (!batteryToGridActive && gridToBatteryActive) {
          cssGridToBattery = CssClass.BatteryExport;
        } else {
          cssGridToBattery = CssClass.BatteryExport;
          cssBatteryToGrid = CssClass.GridExport + " dashed";
        }
      }

      if (cssGridToBattery && grid.firstImportEntity && battery.firstExportEntity) {
        lines.push({
          cssLine: cssGridToBattery,
          cssDot: cssGridToBatteryDot,
          path: this._gridToBatteryPath,
          active: gridToBatteryActive,
          animDuration: animSpeeds.gridToBattery
        });
      }

      if (cssBatteryToGrid && battery.firstImportEntity && grid.firstExportEntity) {
        lines.push({
          cssLine: cssBatteryToGrid,
          cssDot: CssClass.GridExport,
          path: this._batteryToGridPath,
          active: batteryToGridActive,
          animDuration: animSpeeds.batteryToGrid
        });
      }
    }

    if (entityStates.lowCarbon.isPresent && grid.firstImportEntity) {
      lines.push({
        cssLine: CssClass.LowCarbon,
        cssDot: CssClass.LowCarbon,
        path: this._lowCarbonToGridPath,
        active: states.lowCarbon > 0,
        animDuration: animSpeeds.lowCarbon
      });
    }

    if (entityStates.gas.isPresent) {
      lines.push({
        cssLine: CssClass.Gas,
        cssDot: CssClass.Gas,
        path: this._gasToHomePath,
        active: states.gasImport > 0,
        animDuration: animSpeeds.gas
      });
    }

    return renderFlowLines(this._config, lines);
  }

  //================================================================================================================================================================================//

  private _calculateFlowLines(): void {
    const elem = this?.shadowRoot?.querySelector(".lines");
    const widthStr = elem ? getComputedStyle(elem).getPropertyValue("width") : "0px";
    const width: number = parseInt(widthStr.replace("px", ""), 10);

    if (width !== this._width) {
      this._width = width;

      if (width > 0) {
        const isTopRowPresent: boolean = (this._entityStates.lowCarbon.isPresent && this._entityStates.grid.isPresent) || this._entityStates.solar.isPresent || this._entityStates.gas.isPresent;
        const numColumns: number = this._getNumColumns();
        const colSpacing: number = Math.max(COL_SPACING, (width - numColumns * CIRCLE_SIZE) / (numColumns - 1));
        let textLineHeight: number = 0;

        const label = this?.shadowRoot?.querySelector(".label");

        if (label) {
          textLineHeight = parseFloat(getComputedStyle(label).getPropertyValue("line-height").replace("px", ""));
        }


        const battery: boolean = !!this._entityStates.battery.firstExportEntity;
        const grid: boolean = !!this._entityStates.grid.firstImportEntity;
        const solar: boolean = this._entityStates.solar.isPresent;

        const col1X: number = CIRCLE_SIZE - DOT_DIAMETER;
        const col2X: number = CIRCLE_SIZE + colSpacing + CIRCLE_SIZE / 2;
        const col3X: number = CIRCLE_SIZE + colSpacing + CIRCLE_SIZE + colSpacing + DOT_DIAMETER;

        const row1Y: number = CIRCLE_SIZE + textLineHeight - DOT_DIAMETER;
        const row2Y: number = (isTopRowPresent ? CIRCLE_SIZE + textLineHeight + ROW_SPACING : 0) + CIRCLE_SIZE / 2;
        const row3Y: number = (isTopRowPresent ? CIRCLE_SIZE + textLineHeight + ROW_SPACING : 0) + CIRCLE_SIZE + ROW_SPACING + DOT_DIAMETER;

        this._solarToBatteryPath = `M${col2X},${row1Y} V${row3Y}`;
        this._gridToHomePath = `M${col1X},${row2Y} H${col3X}`;
        this._lowCarbonToGridPath = `M${CIRCLE_SIZE / 2},${row1Y} V${row2Y - CIRCLE_SIZE / 2 + DOT_DIAMETER}`;
        this._gasToHomePath = `M${CIRCLE_SIZE + colSpacing + CIRCLE_SIZE + colSpacing + CIRCLE_SIZE / 2},${row1Y} V${row2Y - CIRCLE_SIZE / 2 + DOT_DIAMETER}`;

        this._solarToHomePath = `M${col2X + FLOW_LINE_SPACING * (battery ? 1 : grid ? 0.5 : 0)},${row1Y}
                               V${row2Y - FLOW_LINE_CURVED - FLOW_LINE_SPACING * (grid ? 1 : battery ? 0.5 : 0)}
                               c0,${FLOW_LINE_CURVED} ${FLOW_LINE_CURVED_CONTROL},${FLOW_LINE_CURVED} ${FLOW_LINE_CURVED},${FLOW_LINE_CURVED}
                               H${col3X}`;

        this._solarToGridPath = `M${col2X - FLOW_LINE_SPACING * (battery ? 1 : 0.5)},${row1Y}
                               V${row2Y - FLOW_LINE_CURVED - FLOW_LINE_SPACING}
                               c0,${FLOW_LINE_CURVED} ${-FLOW_LINE_CURVED_CONTROL},${FLOW_LINE_CURVED} ${-FLOW_LINE_CURVED},${FLOW_LINE_CURVED}
                               H${col1X}`;

        this._batteryToHomePath = `M${col2X + FLOW_LINE_SPACING * (solar ? 1 : grid ? 0.5 : 0)},${row3Y}
                                 V${row2Y + FLOW_LINE_CURVED + FLOW_LINE_SPACING * (grid ? 1 : solar ? 0.5 : 0)}
                                 c0,${-FLOW_LINE_CURVED} ${FLOW_LINE_CURVED_CONTROL},${-FLOW_LINE_CURVED} ${FLOW_LINE_CURVED},${-FLOW_LINE_CURVED}
                                 H${col3X}`;

        this._batteryToGridPath = `M${col2X - FLOW_LINE_SPACING * (solar ? 1 : 0.5)},${row3Y}
                                 V${row2Y + FLOW_LINE_CURVED + FLOW_LINE_SPACING}
                                 c0,${-FLOW_LINE_CURVED} ${-FLOW_LINE_CURVED_CONTROL},${-FLOW_LINE_CURVED} ${-FLOW_LINE_CURVED},${-FLOW_LINE_CURVED}
                                 H${col1X}`;

        this._gridToBatteryPath = `M${col1X},${row2Y + FLOW_LINE_SPACING}
                                 H${col2X - FLOW_LINE_CURVED - FLOW_LINE_SPACING * (solar ? 1 : 0.5)}
                                 c${FLOW_LINE_CURVED_CONTROL * 2},0 ${FLOW_LINE_CURVED},0 ${FLOW_LINE_CURVED},${FLOW_LINE_CURVED}
                                 V${row3Y}`;
      }
    }
  }

  //================================================================================================================================================================================//

  private _getNumColumns = (): number => {
    // TODO: devices
    return 3;
  }

  //================================================================================================================================================================================//

  private _calculateAnimationSpeeds = (states: States): AnimSpeeds => {
    const flows: Flows = states.flows;

    // TODO: devices
    const totalFlows = flows.solarToHome + flows.solarToGrid + flows.solarToBattery + flows.gridToHome + flows.gridToBattery + flows.batteryToHome + flows.batteryToGrid + states.lowCarbon + states.gasImport;

    return {
      batteryToGrid: this._calculateDotRate(flows.batteryToGrid ?? 0, totalFlows),
      batteryToHome: this._calculateDotRate(flows.batteryToHome ?? 0, totalFlows),
      gridToHome: this._calculateDotRate(flows.gridToHome, totalFlows),
      gridToBattery: this._calculateDotRate(flows.gridToBattery ?? 0, totalFlows),
      solarToBattery: this._calculateDotRate(flows.solarToBattery ?? 0, totalFlows),
      solarToGrid: this._calculateDotRate(flows.solarToGrid ?? 0, totalFlows),
      solarToHome: this._calculateDotRate(flows.solarToHome ?? 0, totalFlows),
      lowCarbon: this._calculateDotRate(states.lowCarbon ?? 0, totalFlows),
      gas: this._calculateDotRate(states.gasImport ?? 0, totalFlows)

      // TODO devices
    };
  }

}
