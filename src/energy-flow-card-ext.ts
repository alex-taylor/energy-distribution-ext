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
import { ColourMode, DisplayMode, LowCarbonType, DefaultValues, UnitPosition, UnitPrefixes, CssClass, EnergyUnits, InactiveFlowsMode, GasSourcesMode, Scale } from "@/enums";
import { HomeState } from "@/states/home";
import { SingleValueState } from "@/states/state";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, COL_SPACING_MIN, DEVICE_CLASS_ENERGY, DEVICE_CLASS_MONETARY, DOT_DIAMETER } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, EntitiesOptions, GlobalOptions, FlowsOptions, ColourOptions, EnergyUnitsOptions, PowerOutageOptions, EntityOptions, EnergyUnitsConfig, SecondaryInfoConfig, BatteryConfig, GridConfig, HomeConfig } from "@/config";
import { setDualValueNodeDynamicStyles, setDualValueNodeStaticStyles, setHomeNodeDynamicStyles, setHomeNodeStaticStyles, setSingleValueNodeStyles } from "@/ui-helpers/styles";
import { renderFlowLines, renderSegmentedCircle } from "@/ui-helpers/renderers";
import { AnimationDurations, FlowLine, getGasSourcesMode, PathScaleFactors, SegmentGroup } from "@/ui-helpers";
import { LowCarbonState } from "@/states/low-carbon";
import { mdiArrowDown, mdiArrowUp, mdiArrowLeft, mdiArrowRight, mdiFlash, mdiFire } from "@mdi/js";

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

const FLOW_LINE_SPACING: number = DOT_DIAMETER + 5;

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
  private _pathScaleFactors: PathScaleFactors = {
    horizLine: 0,
    vertLine: 0,
    curvedLine: 0,
    topRowLine: 0
  };

  private _entityStates!: EntityStates;
  private _kiloToMegaThreshold!: Decimal;
  private _wattToKiloThreshold!: Decimal;
  private _displayPrecisionUnder10: number = DefaultValues.Display_Precision_Under_10;
  private _displayPrecisionUnder100: number = DefaultValues.Display_Precision_Under_100;
  private _displayPrecision: number = DefaultValues.Display_Precision;
  private _energyUnitPrefixes!: UnitPrefixes;
  private _energyUnitPosition!: UnitPosition;
  private _showZeroStates: boolean = true;
  private _showSegmentGaps: boolean = false;
  private _useHassColours: boolean = true;
  private _lowCarbonAsPercentage: boolean = true;
  private _inactiveFlowsCss: string = CssClass.Inactive;
  private _scale: Scale = Scale.Linear;
  private _minFlowRate: number = DefaultValues.Min_Flow_Rate;
  private _maxFlowRate: number = DefaultValues.Max_Flow_Rate;
  private _circleSize: number = DefaultValues.Circle_Size;
  private _rowSpacing: number = 0;
  private _colSpacing: number = 0;
  private _flowLineCurved: number = 0;
  private _flowLineCurvedControl: number = 0;

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
    this._useHassColours = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Use_HASS_Style] ?? true;
    this._lowCarbonAsPercentage = this._config?.[EditorPages.Low_Carbon]?.[GlobalOptions.Options]?.[EntitiesOptions.Low_Carbon_Mode] === LowCarbonType.Percentage;
    this._scale = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Scale] || Scale.Linear;
    this._minFlowRate = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Min_Rate] || DefaultValues.Min_Flow_Rate;
    this._maxFlowRate = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Max_Rate] || DefaultValues.Max_Flow_Rate;

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
    this._kiloToMegaThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Kwh_Mwh_Threshold] || DefaultValues.Kwh_Mwh_Threshold);
    this._wattToKiloThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Wh_Kwh_Threshold] || DefaultValues.Whk_Wh_Threshold);
    this._displayPrecisionUnder10 = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Under_10] ?? DefaultValues.Display_Precision_Under_10;
    this._displayPrecisionUnder100 = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Under_100] ?? DefaultValues.Display_Precision_Under_100;
    this._displayPrecision = energyUnitsConfig?.[EnergyUnitsOptions.Display_Precision_Default] ?? DefaultValues.Display_Precision;

    setSingleValueNodeStyles(this._config?.[EditorPages.Low_Carbon]!, CssClass.Low_Carbon, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Solar]!, CssClass.Solar, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Gas]!, CssClass.Gas, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Grid]!, CssClass.Grid, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Battery]!, CssClass.Battery, this.style);

    this.style.setProperty("--clickable-cursor", this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Clickable_Entities] ? "pointer" : "default");
    this.style.setProperty("--inactive-path-color", this._useHassColours && this._inactiveFlowsCss !== CssClass.Inactive ? "var(--primary-text-color)" : "var(--disabled-text-color)");

    this._rowSpacing = Math.round(this._circleSize * 3 / 8);
    this._colSpacing = Math.round(this._circleSize * 5 / 8);
    this._flowLineCurved = this._circleSize / 2 + this._rowSpacing - FLOW_LINE_SPACING;
    this._flowLineCurvedControl = Math.round(this._flowLineCurved / 3);

    this.style.setProperty("--circle-size", this._circleSize + "px");
    this.style.setProperty("--row-spacing", this._rowSpacing + "px");
    this.style.setProperty("--col-spacing", this._colSpacing + "px");
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
    const animationDurations: AnimationDurations = this._calculateAnimationDurations(states);

    // TODO: move the style on ha-card to the css
    return html`
      <ha-card .header=${this._config?.[GlobalOptions.Title]} style="min-width: calc(${this._circleSize * 3 + COL_SPACING_MIN * 2}px + 2 * var(--ha-card-border-width, 1px) + 2 * var(--ha-space-4));">
        <div class="card-content" id=${CARD_NAME}>

        <!-- flow lines -->
        ${this._renderFlowLines(states, animationDurations)}

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
    const valueCss: string = CssClass.Low_Carbon + " " + inactiveCss;

    return html`
      <div class="node top-row ${CssClass.Low_Carbon}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${this._renderSecondarySpan(state.secondary, secondaryState, valueCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueCss, state.firstImportEntity, undefined, primaryState, energyUnits)}
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
    const valueCss: string = cssClass + " " + inactiveCss;

    return html`
      <div class="node top-row ${cssClass}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${this._renderSecondarySpan(state.secondary, secondaryState, valueCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueCss, state.firstImportEntity, undefined, primaryState, energyUnits)}
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

    const config: BatteryConfig = this._config[EditorPages.Battery]!;
    const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]!;
    const flows: Flows = states.flows;
    const highCarbon: number = 1 - (states.lowCarbonPercentage / 100);
    let mainEntityId: string = "";
    const segmentGroups: SegmentGroup[] = [];

    if (state.firstExportEntity) {
      mainEntityId = state.firstExportEntity;

      if (circleMode === ColourMode.Dynamic) {
        segmentGroups.push(
          {
            inactiveCss: CssClass.Battery_Export,
            segments: [
              {
                state: flows.gridToBattery * highCarbon || 0,
                cssClass: CssClass.Grid_Import
              },
              {
                state: flows.gridToBattery * (1 - highCarbon) || 0,
                cssClass: CssClass.Low_Carbon
              },
              {
                state: flows.solarToBattery || 0,
                cssClass: CssClass.Solar
              }
            ]
          }
        );
      }
    }

    if (state.firstImportEntity) {
      mainEntityId = state.firstImportEntity;

      if (circleMode === ColourMode.Dynamic) {
        segmentGroups.push(
          {
            inactiveCss: CssClass.Battery_Import,
            segments: [
              {
                state: flows.batteryToHome || 0,
                cssClass: CssClass.Battery_Import
              },
              {
                state: flows.batteryToGrid || 0,
                cssClass: CssClass.Grid_Export
              }
            ]
          }
        );
      }
    }

    setDualValueNodeDynamicStyles(config, CssClass.Battery, states.batteryExport, states.batteryImport, this.style);

    const inactiveCss: string = states.batteryExport === 0 && states.batteryImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssImport: string = states.batteryImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssExport: string = states.batteryExport === 0 ? this._inactiveFlowsCss : "";
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : "";

    return html`
      <div class="node bottom-row ${CssClass.Battery}">
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}" @click=${this._handleClick(mainEntityId)} @keyDown=${this._handleKeyDown(mainEntityId)}>
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, this._circleSize, 180, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(state.secondary, states.batterySecondary, CssClass.Battery + " " + inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.Battery_Export + " " + inactiveCssExport, state.firstExportEntity, mdiArrowDown, state.firstExportEntity ? states.batteryExport : undefined, energyUnits)}
            ${this._renderEnergyStateSpan(CssClass.Battery_Import + " " + inactiveCssImport, state.firstImportEntity, mdiArrowUp, state.firstImportEntity ? states.batteryImport : undefined, energyUnits)}
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

    const config: GridConfig = this._config[EditorPages.Grid]!;
    const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]!;
    const flows: Flows = states.flows;
    let mainEntityId: string = "";
    const segmentGroups: SegmentGroup[] = [];

    if (state.firstExportEntity) {
      mainEntityId = state.firstExportEntity;

      if (circleMode === ColourMode.Dynamic) {
        segmentGroups.push(
          {
            inactiveCss: CssClass.Grid_Export,
            segments: [
              {
                state: flows.solarToGrid || 0,
                cssClass: CssClass.Solar
              },
              {
                state: flows.batteryToGrid || 0,
                cssClass: CssClass.Battery_Import
              }
            ]
          }
        );
      }
    }

    if (state.firstImportEntity) {
      mainEntityId = state.firstImportEntity;

      if (circleMode === ColourMode.Dynamic) {
        segmentGroups.push(
          {
            inactiveCss: CssClass.Grid_Import,
            segments: [
              {
                state: flows.gridToBattery || 0,
                cssClass: CssClass.Battery_Export
              },
              {
                state: flows.gridToHome || 0,
                cssClass: CssClass.Grid_Import
              }
            ]
          }
        );
      }
    }

    setDualValueNodeDynamicStyles(config, CssClass.Grid, states.gridExport, states.gridImport, this.style);

    const inactiveCss: string = states.gridExport === 0 && states.gridImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssImport: string = states.gridImport === 0 ? this._inactiveFlowsCss : "";
    const inactiveCssExport: string = states.gridExport === 0 ? this._inactiveFlowsCss : "";
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : "";

    return html`
      <div class="node ${CssClass.Grid}">
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}" @click=${this._handleClick(mainEntityId)} @keyDown=${this._handleKeyDown(mainEntityId)}>
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, this._circleSize, 270, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(this._entityStates.grid.secondary, states.gridSecondary, CssClass.Grid + " " + inactiveCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(CssClass.Grid_Export + " " + inactiveCssExport, state.firstExportEntity, mdiArrowLeft, state.firstExportEntity ? states.gridExport : undefined, energyUnits)}
            ${this._renderEnergyStateSpan(CssClass.Grid_Import + " " + inactiveCssImport, state.firstImportEntity, mdiArrowRight, state.firstImportEntity ? states.gridImport : undefined, energyUnits)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderHomeNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: HomeState = this._entityStates.home;
    const config: HomeConfig = this._config[EditorPages.Home]!;
    const circleMode: ColourMode = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle]!;

    const flows: Flows = states.flows;
    const highCarbonConsumption: number = states.highCarbon * (flows.gridToHome / states.gridImport) || 0;
    const lowCarbonConsumption: number = states.lowCarbon * (flows.gridToHome / states.gridImport) || 0;

    // TODO: gas-producing devices
    const gasSourcesMode: GasSourcesMode = this._entityStates.gas.isPresent ? getGasSourcesMode(config, states) : GasSourcesMode.Do_Not_Show;

    const segmentGroups: SegmentGroup[] = [];

    if (circleMode === ColourMode.Dynamic) {
      segmentGroups.push(
        {
          inactiveCss: this._useHassColours ? CssClass.Grid_Import : CssClass.Inactive,
          segments: [
            {
              state: flows.solarToHome || 0,
              cssClass: CssClass.Solar
            },
            {
              state: flows.batteryToHome || 0,
              cssClass: CssClass.Battery_Import
            },
            {
              state: lowCarbonConsumption || 0,
              cssClass: CssClass.Low_Carbon
            },
            {
              state: highCarbonConsumption || 0,
              cssClass: CssClass.Grid_Import
            }
          ]
        }
      );

      // TODO: electric-producing devices

      if (gasSourcesMode !== GasSourcesMode.Do_Not_Show) {
        // TODO: gas-producing devices
        segmentGroups[0].segments.unshift({
          state: states.homeGas,
          cssClass: CssClass.Gas
        });
      }
    }

    setHomeNodeStaticStyles(this._config?.[EditorPages.Home]!, this.style);
    setHomeNodeDynamicStyles(config, states, this.style);

    const inactiveCss: string = states.homeElectric === 0 ? this._inactiveFlowsCss : "";
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : "";
    const valueElectricCss: string = CssClass.Home + " " + CssClass.Electric + " " + inactiveCss;
    const valueGasCss: string = CssClass.Home + " " + CssClass.Gas + " " + inactiveCss;
    const valueSecondaryCss: string = CssClass.Home + " " + inactiveCss;
    let electricIcon: string | undefined;
    let gasIcon: string | undefined;
    let electricTotal: number = states.homeElectric;
    let gasTotal: number | undefined;

    switch (gasSourcesMode) {
      case GasSourcesMode.Add_To_Total:
        electricTotal += states.homeGas;
        gasTotal = undefined;
        electricIcon = gasIcon = undefined;
        break;

      case GasSourcesMode.Show_Separately:
        gasTotal = states.homeGas;
        electricIcon = mdiFlash;
        gasIcon = mdiFire;
        break;

      case GasSourcesMode.Do_Not_Show:
      default:
        gasTotal = undefined;
        electricIcon = gasIcon = undefined;
        break;
    }

    return html`
      <div class="node ${CssClass.Home}">
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}">
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, this._circleSize, 0, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(state.secondary, states.homeSecondary, valueSecondaryCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueElectricCss, undefined, electricIcon, electricTotal, energyUnits)}
            ${this._renderEnergyStateSpan(valueGasCss, undefined, gasIcon, gasTotal, energyUnits)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderEnergyStateSpan = (cssClass: string, entityId: string | undefined, icon: string | undefined, state: number | undefined, energyUnits: string | undefined): TemplateResult => {
    if (state === undefined || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    return html`
      <span class="value ${cssClass}" @click=${this._handleClick(entityId)} @keyDown=${this._handleKeyDown(entityId)}>
        <ha-svg-icon class="small ${icon ? '' : 'hidden'}" .path=${icon}></ha-svg-icon>
        ${this._renderEnergyState(state, energyUnits)}
      </span>
    `;
  }

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

    const e: CustomEvent = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });

    this.dispatchEvent(e);
  };

  //================================================================================================================================================================================//

  private _renderSecondarySpan(secondary: SecondaryInfoState, state: number, cssClass: string): TemplateResult {
    if (!secondary.isPresent || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const entityId: string = secondary.firstImportEntity!;

    state = Math.abs(state) < (secondary.config?.[EntityOptions.Zero_Threshold] ?? 0)
      ? 0
      : state;

    return html`
        <span class="secondary-info ${cssClass}" @click=${this._handleClick(entityId)} @keyDown=${(this._handleKeyDown(entityId))}>
          ${secondary.icon ? html`<ha-icon class="secondary-info small ${cssClass}" .icon=${secondary.icon}></ha-icon>` : ""}
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

  private _renderFlowLines = (states: States, animationDurations: AnimationDurations): TemplateResult => {
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
        animDuration: animationDurations.solarToHome
      });
    }

    if (solar.isPresent && grid.firstExportEntity) {
      lines.push({
        cssLine: CssClass.Grid_Export,
        cssDot: CssClass.Grid_Export,
        path: this._solarToGridPath,
        active: flows.solarToGrid > 0,
        animDuration: animationDurations.solarToGrid
      });
    }

    if (solar.isPresent && battery.firstExportEntity) {
      lines.push({
        cssLine: CssClass.Battery_Export,
        cssDot: CssClass.Battery_Export,
        path: this._solarToBatteryPath,
        active: flows.solarToBattery > 0,
        animDuration: animationDurations.solarToBattery
      });
    }

    if (grid.firstImportEntity) {
      lines.push({
        cssLine: CssClass.Grid_Import,
        cssDot: CssClass.Grid_Import,
        path: this._gridToHomePath,
        active: flows.gridToHome > 0,
        animDuration: animationDurations.gridToHome
      });
    }

    if (battery.firstImportEntity) {
      lines.push({
        cssLine: CssClass.Battery_Import,
        cssDot: CssClass.Battery_Import,
        path: this._batteryToHomePath,
        active: flows.batteryToHome > 0,
        animDuration: animationDurations.batteryToHome
      });
    }

    if (battery.isPresent && grid.isPresent) {
      const gridToBatteryActive: boolean = flows.gridToBattery > 0;
      const batteryToGridActive: boolean = flows.batteryToGrid > 0;

      let cssGridToBattery: string | undefined = undefined;
      let cssBatteryToGrid: string | undefined = undefined;
      let cssGridToBatteryDot: string = CssClass.Battery_Export;

      if (this._useHassColours) {
        if (!gridToBatteryActive && !batteryToGridActive) {
          cssGridToBattery = CssClass.Inactive;
        } else {
          cssGridToBattery = cssBatteryToGrid = batteryToGridActive ? CssClass.Grid_Export : CssClass.Grid_Import;
          cssGridToBatteryDot = CssClass.Grid_Import;
        }
      } else {
        if (!gridToBatteryActive && batteryToGridActive) {
          cssBatteryToGrid = CssClass.Grid_Export;
        } else if (!batteryToGridActive && gridToBatteryActive) {
          cssGridToBattery = CssClass.Battery_Export;
        } else {
          cssGridToBattery = CssClass.Battery_Export;
          cssBatteryToGrid = CssClass.Grid_Export + " dashed";
        }
      }

      if (cssGridToBattery && grid.firstImportEntity && battery.firstExportEntity) {
        lines.push({
          cssLine: cssGridToBattery,
          cssDot: cssGridToBatteryDot,
          path: this._gridToBatteryPath,
          active: gridToBatteryActive,
          animDuration: animationDurations.gridToBattery
        });
      }

      if (cssBatteryToGrid && battery.firstImportEntity && grid.firstExportEntity) {
        lines.push({
          cssLine: cssBatteryToGrid,
          cssDot: CssClass.Grid_Export,
          path: this._batteryToGridPath,
          active: batteryToGridActive,
          animDuration: animationDurations.batteryToGrid
        });
      }
    }

    if (entityStates.lowCarbon.isPresent && grid.firstImportEntity) {
      lines.push({
        cssLine: CssClass.Low_Carbon,
        cssDot: CssClass.Low_Carbon,
        path: this._lowCarbonToGridPath,
        active: states.lowCarbon > 0,
        animDuration: animationDurations.lowCarbon
      });
    }

    if (entityStates.gas.isPresent) {
      lines.push({
        cssLine: CssClass.Gas,
        cssDot: CssClass.Gas,
        path: this._gasToHomePath,
        active: states.gasImport > 0,
        animDuration: animationDurations.gas
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
        const colSpacing: number = Math.max(COL_SPACING_MIN, (width - numColumns * this._circleSize) / (numColumns - 1));
        let textLineHeight: number = 0;

        const label = this?.shadowRoot?.querySelector(".label");

        if (label) {
          textLineHeight = parseFloat(getComputedStyle(label).getPropertyValue("line-height").replace("px", ""));
        }

        const battery: boolean = !!this._entityStates.battery.firstExportEntity;
        const grid: boolean = !!this._entityStates.grid.firstImportEntity;
        const solar: boolean = this._entityStates.solar.isPresent;

        const col1X: number = this._circleSize - DOT_DIAMETER;
        const col2X: number = this._circleSize + colSpacing + this._circleSize / 2;
        const col3X: number = this._circleSize + colSpacing + this._circleSize + colSpacing + DOT_DIAMETER;

        const row1Y: number = this._circleSize + textLineHeight - DOT_DIAMETER;
        const row2Y: number = (isTopRowPresent ? this._circleSize + textLineHeight + this._rowSpacing : 0) + this._circleSize / 2;
        const row3Y: number = (isTopRowPresent ? this._circleSize + textLineHeight + this._rowSpacing : 0) + this._circleSize + this._rowSpacing + DOT_DIAMETER;

        const topRowLineLength: number = Math.round((row2Y - this._circleSize / 2 + DOT_DIAMETER) - row1Y);
        const horizLineLength: number = Math.round(col3X - col1X);
        const vertLineLength: number = Math.round(row3Y - row1Y);
        const curvedLineLength: number = row2Y - this._flowLineCurved - FLOW_LINE_SPACING * (grid ? 1 : battery ? 0.5 : 0) - row1Y
          + this._cubicBezierLength({ x: 0, y: 0 }, { x: 0, y: this._flowLineCurved }, { x: this._flowLineCurvedControl, y: this._flowLineCurved }, { x: this._flowLineCurved, y: this._flowLineCurved })
          + col3X - this._flowLineCurved - (col2X + FLOW_LINE_SPACING * (battery ? 1 : grid ? 0.5 : 0));

        const maxLineLength: number = Math.max(topRowLineLength, horizLineLength, vertLineLength, curvedLineLength);

        this._pathScaleFactors = {
          horizLine: horizLineLength / maxLineLength,
          vertLine: vertLineLength / maxLineLength,
          curvedLine: curvedLineLength / maxLineLength,
          topRowLine: topRowLineLength / maxLineLength
        };

        this._solarToBatteryPath = `M${col2X},${row1Y} v${vertLineLength}`;
        this._gridToHomePath = `M${col1X},${row2Y} h${horizLineLength}`;
        this._lowCarbonToGridPath = `M${this._circleSize / 2},${row1Y} v${topRowLineLength}`;
        this._gasToHomePath = `M${this._circleSize + colSpacing + this._circleSize + colSpacing + this._circleSize / 2},${row1Y} v${topRowLineLength}`;

        this._solarToHomePath = `M${col2X + FLOW_LINE_SPACING * (battery ? 1 : grid ? 0.5 : 0)},${row1Y}
                               V${row2Y - this._flowLineCurved - FLOW_LINE_SPACING * (grid ? 1 : battery ? 0.5 : 0)}
                               c0,${this._flowLineCurved} ${this._flowLineCurvedControl},${this._flowLineCurved} ${this._flowLineCurved},${this._flowLineCurved}
                               H${col3X}`;

        this._solarToGridPath = `M${col2X - FLOW_LINE_SPACING * (battery ? 1 : 0.5)},${row1Y}
                               V${row2Y - this._flowLineCurved - FLOW_LINE_SPACING}
                               c0,${this._flowLineCurved} ${-this._flowLineCurvedControl},${this._flowLineCurved} ${-this._flowLineCurved},${this._flowLineCurved}
                               H${col1X}`;

        this._batteryToHomePath = `M${col2X + FLOW_LINE_SPACING * (solar ? 1 : grid ? 0.5 : 0)},${row3Y}
                                 V${row2Y + this._flowLineCurved + FLOW_LINE_SPACING * (grid ? 1 : solar ? 0.5 : 0)}
                                 c0,${-this._flowLineCurved} ${this._flowLineCurvedControl},${-this._flowLineCurved} ${this._flowLineCurved},${-this._flowLineCurved}
                                 H${col3X}`;

        this._batteryToGridPath = `M${col2X - FLOW_LINE_SPACING * (solar ? 1 : 0.5)},${row3Y}
                                 V${row2Y + this._flowLineCurved + FLOW_LINE_SPACING}
                                 c0,${-this._flowLineCurved} ${-this._flowLineCurvedControl},${-this._flowLineCurved} ${-this._flowLineCurved},${-this._flowLineCurved}
                                 H${col1X}`;

        this._gridToBatteryPath = `M${col1X},${row2Y + FLOW_LINE_SPACING}
                                 H${col2X - this._flowLineCurved - FLOW_LINE_SPACING * (solar ? 1 : 0.5)}
                                 c${this._flowLineCurvedControl * 2},0 ${this._flowLineCurved},0 ${this._flowLineCurved},${this._flowLineCurved}
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

  private _calculateAnimationDurations = (states: States): AnimationDurations => {
    const gasSourceMode: GasSourcesMode = getGasSourcesMode(this._config?.[EditorPages.Home]!, states);
    const flows: Flows = states.flows;
    const totalFlows: number = states.homeElectric
      + flows.batteryToGrid
      + flows.gridToBattery
      + flows.solarToBattery
      + flows.solarToGrid
      + (gasSourceMode !== GasSourcesMode.Do_Not_Show ? states.homeGas : 0);

    return {
      batteryToGrid: this._calculateDotRate(flows.batteryToGrid ?? 0, totalFlows, this._pathScaleFactors.curvedLine),
      batteryToHome: this._calculateDotRate(flows.batteryToHome ?? 0, totalFlows, this._pathScaleFactors.curvedLine),
      gridToBattery: this._calculateDotRate(flows.gridToBattery ?? 0, totalFlows, this._pathScaleFactors.curvedLine),
      gridToHome: this._calculateDotRate(flows.gridToHome, totalFlows, this._pathScaleFactors.horizLine),
      solarToBattery: this._calculateDotRate(flows.solarToBattery ?? 0, totalFlows, this._pathScaleFactors.vertLine),
      solarToGrid: this._calculateDotRate(flows.solarToGrid ?? 0, totalFlows, this._pathScaleFactors.curvedLine),
      solarToHome: this._calculateDotRate(flows.solarToHome ?? 0, totalFlows, this._pathScaleFactors.curvedLine),
      lowCarbon: this._calculateDotRate(states.lowCarbon ?? 0, totalFlows, this._pathScaleFactors.topRowLine),
      gas: this._calculateDotRate(states.gasImport ?? 0, totalFlows + (gasSourceMode === GasSourcesMode.Do_Not_Show ? states.homeGas : 0), this._pathScaleFactors.topRowLine)

      // TODO devices
    };
  }

  //================================================================================================================================================================================//

  private _calculateDotRate = (value: number, total: number, scale: number): number => {
    if (this._scale === Scale.Logarithmic) {
      value = Math.log(value);
      total = Math.log(total);
    }

    return this._minFlowRate + (1 - (value / total)) * (this._maxFlowRate - this._minFlowRate) * scale;
  };

  //================================================================================================================================================================================//

  // Source - https://stackoverflow.com/a
  // Posted by herrstrietzel, modified by community. See post 'Timeline' for change history
  // Retrieved 2025-12-22, License - CC BY-SA 4.0

  /**
   * Based on snap.svg bezlen() function
   * https://github.com/adobe-webplatform/Snap.svg/blob/master/dist/snap.svg.js#L5786
   */
  private _cubicBezierLength(p0: { x: number, y: number }, cp1: { x: number, y: number }, cp2: { x: number, y: number }, p1: { x: number, y: number }, t: number = 1): number {
    if (t === 0) {
      return 0;
    }

    const base3 = (t, p1, p2, p3, p4): number => {
      let t1: number = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
        t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;

      return t * t2 - 3 * p1 + 3 * p2;
    };

    t = t > 1 ? 1 : t < 0 ? 0 : t;

    let t2: number = t / 2;
    let Tvalues: number[] = [-.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816];
    let Cvalues: number[] = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472];

    let n = Tvalues.length;
    let sum: number = 0;

    for (let i = 0; i < n; i++) {
      let ct = t2 * Tvalues[i] + t2,
        xbase = base3(ct, p0.x, cp1.x, cp2.x, p1.x),
        ybase = base3(ct, p0.y, cp1.y, cp2.y, p1.y),
        comb = xbase * xbase + ybase * ybase;
      sum += Cvalues[i] * Math.sqrt(comb);
    }

    return t2 * sum;
  }

  //================================================================================================================================================================================//
}
