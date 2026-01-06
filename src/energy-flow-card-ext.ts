import { CSSResult, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { formatNumber, HomeAssistant } from "custom-card-helpers";
import { Decimal } from "decimal.js";
import { customElement, property, state } from "lit/decorators.js";
import { getDefaultConfig, cleanupConfig, getCo2SignalEntity, getConfigValue } from "@/config/config";
import { SubscribeMixin } from "@/energy/subscribe-mixin";
import { localize } from "@/localize/localize";
import { styles } from "@/style";
import { BatteryState } from "@/states/battery";
import { GridState } from "@/states/grid";
import { SolarState } from "@/states/solar";
import { SecondaryInfoState } from "@/states/secondary-info";
import { States, Flows } from "@/states";
import { EntityStates } from "@/states/entity-states";
import { HassEntity, UnsubscribeFunc } from "home-assistant-js-websocket";
import { ColourMode, DisplayMode, LowCarbonDisplayMode, UnitPosition, UnitPrefixes, CssClass, EnergyUnitPrefix, InactiveFlowsMode, GasSourcesMode, Scale, PrefixThreshold, EnergyUnits, VolumeUnits, checkEnumValue } from "@/enums";
import { HomeState } from "@/states/home";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, CIRCLE_STROKE_WIDTH_SEGMENTS, DEFAULT_CONFIG, DEFAULT_GAS_CONFIG, DEFAULT_LOW_CARBON_CONFIG, DEFAULT_SOLAR_CONFIG, DEVICE_CLASS_ENERGY, DEVICE_CLASS_MONETARY, DOT_RADIUS, ICON_PADDING } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, EntitiesOptions, GlobalOptions, FlowsOptions, ColourOptions, EnergyUnitsOptions, PowerOutageOptions, EntityOptions, EnergyUnitsConfig, SecondaryInfoConfig, SecondaryInfoOptions, HomeOptions, DualValueNodeConfig, LowCarbonOptions } from "@/config";
import { getColSpacing, MinMax, setDualValueNodeDynamicStyles, setDualValueNodeStaticStyles, setHomeNodeDynamicStyles, setHomeNodeStaticStyles, setLayout, setSingleValueNodeStyles } from "@/ui-helpers/styles";
import { renderFlowLines, renderSegmentedCircle } from "@/ui-helpers/renderers";
import { AnimationDurations, FlowLine, getGasSourcesMode, PathScaleFactors, SegmentGroup } from "@/ui-helpers";
import { LowCarbonState } from "@/states/low-carbon";
import { mdiArrowDown, mdiArrowUp, mdiArrowLeft, mdiArrowRight, mdiFlash, mdiFire } from "@mdi/js";
import { GasState } from "@/states/gas";

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

const CIRCLE_SIZE_MIN = 80;
const DOT_DIAMETER: number = DOT_RADIUS * 2;
const FLOW_LINE_SPACING: number = DOT_DIAMETER + 5;

const FLOW_RATE_MIN: number = 1;
const FLOW_RATE_MAX: number = 6;

const NODE_SPACER: TemplateResult = html`<div class="node-spacer"></div>`;
const HORIZ_SPACER: TemplateResult = html`<div class="horiz-spacer"></div>`;

const MAP_URL: string = "https://app.electricitymaps.com";

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

  private _configs!: EnergyFlowCardExtConfig[];
  private _entityStates!: EntityStates;
  private _displayMode!: DisplayMode;
  private _prefixThreshold!: Decimal;
  private _displayPrecisionUnder10!: number;
  private _displayPrecisionUnder100!: number;
  private _displayPrecision!: number;
  private _energyUnits!: string;
  private _electricUnitPrefixes!: UnitPrefixes;
  private _volumeUnits!: string;
  private _gasUnitPrefixes!: UnitPrefixes;
  private _energyUnitPosition!: UnitPosition;
  private _showZeroStates!: boolean;
  private _showSegmentGaps!: boolean;
  private _clickableEntities!: boolean;
  private _useHassStyles!: boolean;
  private _scale!: Scale;

  private _inactiveFlowsCss: string = CssClass.Inactive;
  private _circleSize: number = CIRCLE_SIZE_MIN;

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

    this._configs = [config, DEFAULT_CONFIG];

    if (getConfigValue(this._configs, [EditorPages.Battery, EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids]).length === 0 &&
      getConfigValue(this._configs, [EditorPages.Battery, EntitiesOptions.Export_Entities, EntityOptions.Entity_Ids]).length === 0 &&
      getConfigValue(this._configs, [EditorPages.Grid, EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids]).length === 0 &&
      getConfigValue(this._configs, [EditorPages.Grid, EntitiesOptions.Export_Entities, EntityOptions.Entity_Ids]).length === 0 &&
      getConfigValue(this._configs, [EditorPages.Solar, EntitiesOptions.Entities, EntityOptions.Entity_Ids]).length === 0 &&
      getConfigValue(this._configs, [EditorPages.Gas, EntitiesOptions.Entities, EntityOptions.Entity_Ids]).length === 0) {
      // TODO: this might not be entirely true once devices are present
      throw new Error("At least one entity for battery, gas, grid or solar must be defined");
    }

    this._config = cleanupConfig(this.hass, config);
    this.resetSubscriptions();

    this._displayMode = getConfigValue(this._configs, [GlobalOptions.Display_Mode]);
    this._showZeroStates = getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Show_Zero_States]);
    this._showSegmentGaps = getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Segment_Gaps]);
    this._useHassStyles = getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Use_HASS_Style]);
    this._clickableEntities = getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Clickable_Entities]);
    this._scale = getConfigValue(this._configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Scale], value => checkEnumValue(value, Scale));

    switch (getConfigValue(this._configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Inactive_Flows])) {
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

    const energyUnitsConfig: EnergyUnitsConfig[] = [
      getConfigValue(this._configs, [EditorPages.Appearance, AppearanceOptions.Energy_Units]),
      getConfigValue([DEFAULT_CONFIG], [EditorPages.Appearance, AppearanceOptions.Energy_Units])
    ];

    this._energyUnits = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Electric_Units], value => checkEnumValue(value, EnergyUnits));
    this._electricUnitPrefixes = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Electric_Unit_Prefixes], value => checkEnumValue(value, UnitPrefixes));
    this._volumeUnits = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Gas_Units], value => checkEnumValue(value, VolumeUnits));
    this._gasUnitPrefixes = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Gas_Unit_Prefixes], value => checkEnumValue(value, UnitPrefixes));
    this._energyUnitPosition = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Unit_Position], value => checkEnumValue(value, UnitPosition));
    this._prefixThreshold = new Decimal(getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Prefix_Threshold], value => checkEnumValue(value, PrefixThreshold)));
    this._displayPrecisionUnder10 = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Display_Precision_Under_10]);
    this._displayPrecisionUnder100 = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Display_Precision_Under_100]);
    this._displayPrecision = getConfigValue(energyUnitsConfig, [EnergyUnitsOptions.Display_Precision_Default]);

    setSingleValueNodeStyles(this._config?.[EditorPages.Low_Carbon]!, DEFAULT_LOW_CARBON_CONFIG, CssClass.Low_Carbon, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Solar]!, DEFAULT_SOLAR_CONFIG, CssClass.Solar, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Gas]!, DEFAULT_GAS_CONFIG, CssClass.Gas, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Grid]!, CssClass.Grid, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Battery]!, CssClass.Battery, this.style);

    this.style.setProperty("--clickable-cursor", this._clickableEntities ? "pointer" : "default");
    this.style.setProperty("--inactive-flow-color", this._useHassStyles && this._inactiveFlowsCss !== CssClass.Inactive ? "var(--primary-text-color)" : "var(--disabled-text-color)");

    if (!!this.style.getPropertyValue("--circle-size")) {
      setLayout(this.style, CIRCLE_SIZE_MIN);
    }
  }

  //================================================================================================================================================================================//

  protected render(): TemplateResult {
    if (!this._config || !this.hass || !this._entityStates) {
      return html``;
    }

    if (this._loading) {
      return html`<ha-card style="padding: 2rem">${this.hass.localize("ui.panel.lovelace.cards.energy.loading")}</ha-card>`;
    }

    if (!this._entityStates.isDatePickerPresent && this._displayMode !== DisplayMode.Today) {
      return html`
        <ha-card style="padding: 2rem">
          ${this.hass.localize("ui.panel.lovelace.cards.energy.loading")}<br/>
          Make sure you have the Energy Integration set up and a Date Selector in this View or set <pre>display_mode: today</pre>
        </ha-card>`;
    }

    this._calculateLayout();

    const states: States = this._entityStates.getStates();
    const electricUnitPrefix: EnergyUnitPrefix | undefined = this._electricUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestElectricValue)) : undefined;
    const gasUnitPrefix: EnergyUnitPrefix | undefined = this._gasUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestGasValue)) : undefined;
    const animationDurations: AnimationDurations = this._calculateAnimationDurations(states);

    return html`
      <ha-card .header=${getConfigValue(this._configs, [GlobalOptions.Title])}>
        <div class="card-content" id=${CARD_NAME}>

        <!-- flow lines -->
        ${this._renderFlowLines(states, animationDurations)}

        <!-- top row -->
        <div class="row">

          <!-- top left -->
          ${this._renderLowCarbonNode(states, electricUnitPrefix)}

          ${HORIZ_SPACER}

          <!-- top centre -->
          ${this._renderSolarNode(states, electricUnitPrefix)}

          ${HORIZ_SPACER}

          <!-- top right -->
          ${this._renderGasNode(states, gasUnitPrefix)}

        </div>

        <!-- middle row -->
        <div class="row">

          <!-- middle left -->
          ${this._renderGridNode(states, electricUnitPrefix)}

          ${HORIZ_SPACER}

          <!-- middle centre -->
          ${NODE_SPACER}

          ${HORIZ_SPACER}

          <!-- middle right -->
          ${this._renderHomeNode(states, electricUnitPrefix, gasUnitPrefix)}

        </div>

        <!-- bottom row -->
        <div class="row">

          <!-- bottom left -->
          ${NODE_SPACER}

          ${HORIZ_SPACER}

          <!-- bottom centre -->
          ${this._renderBatteryNode(states, electricUnitPrefix)}

          ${HORIZ_SPACER}

          <!-- bottom right -->
          ${NODE_SPACER}

        </div>

      </div>

      <!-- dashboard link -->
      ${getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Dashboard_Link])
        ? html`
          <div class="card-actions">
            <a href=${getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Dashboard_Link])}>
              <mwc-button>
                ${getConfigValue(this._configs, [EditorPages.Appearance, GlobalOptions.Options, AppearanceOptions.Dashboard_Link_Label]) || this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
              </mwc-button>
            </a>
          </div>
        `
        : ""}
      </ha-card>
    `;
  }

  //================================================================================================================================================================================//

  private _renderLowCarbonNode(states: States, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult {
    const state: LowCarbonState = this._entityStates.lowCarbon;

    if (!this._entityStates.grid.isPresent || !state.isPresent) {
      return NODE_SPACER;
    }

    let electricityMapUrl: string = MAP_URL;
    const co2State: HassEntity = this.hass.states[getCo2SignalEntity(this.hass)];

    if (co2State?.attributes.country_code) {
      electricityMapUrl += `/zone/${co2State?.attributes.country_code}`;
    }

    const mode: LowCarbonDisplayMode = getConfigValue(this._configs, [EditorPages.Low_Carbon, GlobalOptions.Options, LowCarbonOptions.Low_Carbon_Mode]);
    const energyState: number | undefined = mode === LowCarbonDisplayMode.Percentage ? undefined : states.gridImport === 0 ? 0 : states.lowCarbon;
    const energyPercentage: number | undefined = mode === LowCarbonDisplayMode.Energy ? undefined : states.gridImport === 0 ? 0 : states.lowCarbonPercentage;
    const inactiveCss: string = energyState === 0 ? this._inactiveFlowsCss : "";
    const valueCss: string = CssClass.Low_Carbon + " " + inactiveCss;

    return html`
      <div class="node top-row ${CssClass.Low_Carbon}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <a class="circle background" href=${electricityMapUrl} target="_blank" rel="noopener noreferrer">
          <div class="circle ${inactiveCss}">
            ${this._renderSecondarySpan(state.secondary, states.lowCarbonSecondary, valueCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueCss, undefined, undefined, energyState, this._energyUnits, overridePrefix)}
            ${this._renderEnergyStateSpan(valueCss, undefined, undefined, energyPercentage, "%", EnergyUnitPrefix.None)}
          </div>
        </a>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderSolarNode(states: States, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult {
    const state: SolarState = this._entityStates.solar;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const flows: Flows = states.flows;
    const circleMode: ColourMode = getConfigValue(this._configs, [EditorPages.Solar, EntitiesOptions.Colours, ColourOptions.Circle]);
    const segmentGroups: SegmentGroup[] = [];

    if (circleMode === ColourMode.Dynamic) {
      segmentGroups.push(
        {
          inactiveCss: CssClass.Solar,
          segments: [
            {
              state: flows.solarToBattery ?? 0,
              cssClass: CssClass.Battery_Export
            },
            {
              state: flows.solarToGrid ?? 0,
              cssClass: CssClass.Grid_Export
            },
            {
              state: flows.solarToHome ?? 0,
              cssClass: CssClass.Solar
            }
          ]
        }
      );
    }

    const primaryState: number = states.solarImport;
    const inactiveCss: string = primaryState === 0 ? this._inactiveFlowsCss : "";
    const valueCss: string = CssClass.Solar + " " + inactiveCss;
    const borderCss: string = circleMode === ColourMode.Dynamic ? CssClass.Hidden_Circle : "";

    return html`
      <div class="node top-row ${CssClass.Solar}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${borderCss} ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${circleMode === ColourMode.Dynamic ? renderSegmentedCircle(this._config, segmentGroups, this._circleSize, 0, this._showSegmentGaps) : ""}
            ${this._renderSecondarySpan(state.secondary, states.solarSecondary, valueCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueCss, state.firstImportEntity, undefined, primaryState, this._energyUnits, overridePrefix)}
          </div>
        </div>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderGasNode(states: States, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult {
    const state: GasState = this._entityStates.gas;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    let units: string;
    let primaryState: number;

    if (this._volumeUnits === VolumeUnits.Same_As_Electric) {
      primaryState = states.gasImport;
      units = this._energyUnits;
    } else {
      primaryState = states.gasImportVolume;
      units = this._volumeUnits;
    }

    const inactiveCss: string = primaryState === 0 ? this._inactiveFlowsCss : "";
    const valueCss: string = CssClass.Gas + " " + inactiveCss;

    return html`
      <div class="node top-row ${CssClass.Gas}">
        <span class="label ${inactiveCss}">${state.name}</span>
        <div class="circle background">
          <div class="circle ${inactiveCss}" @click=${this._handleClick(state.firstImportEntity)} @keyDown=${this._handleKeyDown(state.firstImportEntity)}}>
            ${this._renderSecondarySpan(state.secondary, states.gasSecondary, valueCss)}
            <ha-icon class="entity-icon ${inactiveCss}" .icon=${state.icon}></ha-icon>
            ${this._renderEnergyStateSpan(valueCss, state.firstImportEntity, undefined, primaryState, units, overridePrefix)}
          </div>
        </div>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderBatteryNode = (states: States, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult => {
    const state: BatteryState = this._entityStates.battery;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const circleMode: ColourMode = getConfigValue(this._configs, [EditorPages.Battery, EntitiesOptions.Colours, ColourOptions.Circle]);
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
                state: flows.gridToBattery * highCarbon ?? 0,
                cssClass: CssClass.Grid_Import
              },
              {
                state: flows.gridToBattery * (1 - highCarbon) ?? 0,
                cssClass: CssClass.Low_Carbon
              },
              {
                state: flows.solarToBattery ?? 0,
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
                state: flows.batteryToHome ?? 0,
                cssClass: CssClass.Battery_Import
              },
              {
                state: flows.batteryToGrid ?? 0,
                cssClass: CssClass.Grid_Export
              }
            ]
          }
        );
      }
    }

    setDualValueNodeDynamicStyles(this._config[EditorPages.Battery]!, CssClass.Battery, states.batteryExport, states.batteryImport, this.style);

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
            ${this._renderEnergyStateSpan(CssClass.Battery_Export + " " + inactiveCssExport, state.firstExportEntity, mdiArrowDown, state.firstExportEntity ? states.batteryExport : undefined, this._energyUnits, overridePrefix)}
            ${this._renderEnergyStateSpan(CssClass.Battery_Import + " " + inactiveCssImport, state.firstImportEntity, mdiArrowUp, state.firstImportEntity ? states.batteryImport : undefined, this._energyUnits, overridePrefix)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderGridNode = (states: States, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult => {
    // TODO: power outage

    const state: GridState = this._entityStates.grid;

    if (!state.isPresent) {
      return NODE_SPACER;
    }

    const circleMode: ColourMode = getConfigValue(this._configs, [EditorPages.Grid, EntitiesOptions.Colours, ColourOptions.Circle]);
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
                state: flows.solarToGrid ?? 0,
                cssClass: CssClass.Solar
              },
              {
                state: flows.batteryToGrid ?? 0,
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
                state: flows.gridToBattery ?? 0,
                cssClass: CssClass.Battery_Export
              },
              {
                state: flows.gridToHome ?? 0,
                cssClass: CssClass.Grid_Import
              }
            ]
          }
        );
      }
    }

    setDualValueNodeDynamicStyles(this._config[EditorPages.Grid]!, CssClass.Grid, states.gridExport, states.gridImport, this.style);

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
            ${this._renderEnergyStateSpan(CssClass.Grid_Export + " " + inactiveCssExport, state.firstExportEntity, mdiArrowLeft, state.firstExportEntity ? states.gridExport : undefined, this._energyUnits, overridePrefix)}
            ${this._renderEnergyStateSpan(CssClass.Grid_Import + " " + inactiveCssImport, state.firstImportEntity, mdiArrowRight, state.firstImportEntity ? states.gridImport : undefined, this._energyUnits, overridePrefix)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderHomeNode = (states: States, overrideElectricUnitPrefix: EnergyUnitPrefix | undefined, overrideGasUnitPrefix: EnergyUnitPrefix | undefined): TemplateResult => {
    const state: HomeState = this._entityStates.home;
    const circleMode: ColourMode = getConfigValue(this._configs, [EditorPages.Home, EntitiesOptions.Colours, ColourOptions.Circle]);

    const flows: Flows = states.flows;
    const highCarbonConsumption: number = states.highCarbon * (flows.gridToHome / states.gridImport) ?? 0;
    const lowCarbonConsumption: number = states.lowCarbon * (flows.gridToHome / states.gridImport) ?? 0;

    // TODO: gas-producing devices
    const gasSourcesMode: GasSourcesMode = this._entityStates.gas.isPresent ? getGasSourcesMode(this._config, states) : GasSourcesMode.Do_Not_Show;

    const segmentGroups: SegmentGroup[] = [];

    if (circleMode === ColourMode.Dynamic) {
      segmentGroups.push(
        {
          inactiveCss: this._useHassStyles ? CssClass.Grid_Import : CssClass.Inactive,
          segments: [
            {
              state: flows.solarToHome ?? 0,
              cssClass: CssClass.Solar
            },
            {
              state: flows.batteryToHome ?? 0,
              cssClass: CssClass.Battery_Import
            },
            {
              state: lowCarbonConsumption ?? 0,
              cssClass: CssClass.Low_Carbon
            },
            {
              state: highCarbonConsumption ?? 0,
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

    setHomeNodeStaticStyles(this._config[EditorPages.Home]!, this.style);
    setHomeNodeDynamicStyles(this._config, states, this.style);

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
        gasTotal = this._volumeUnits === VolumeUnits.Same_As_Electric ? states.homeGas : states.homeGasVolume;
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
            ${this._renderEnergyStateSpan(valueElectricCss, undefined, electricIcon, electricTotal, this._energyUnits, overrideElectricUnitPrefix)}
            ${this._renderEnergyStateSpan(valueGasCss, undefined, gasIcon, gasTotal, this._getVolumeUnits(), overrideGasUnitPrefix)}
          </div>
        </div>
        <span class="label ${inactiveCss}">${state.name}</span>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderEnergyStateSpan = (cssClass: string, entityId: string | undefined, icon: string | undefined, state: number | undefined, units: string, overridePrefix: EnergyUnitPrefix | undefined): TemplateResult => {
    if (state === undefined || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    return html`
      <span class="value ${cssClass}" @click=${this._handleClick(entityId)} @keyDown=${this._handleKeyDown(entityId)}>
        <ha-svg-icon class="small ${icon ? '' : 'hidden'}" .path=${icon}></ha-svg-icon>
        ${this._renderEnergyState(state, units, overridePrefix)}
      </span>
    `;
  }

  //================================================================================================================================================================================//

  private _calculateEnergyUnitPrefix(value: Decimal): EnergyUnitPrefix {
    const prefixes: EnergyUnitPrefix[] = Object.values(EnergyUnitPrefix);

    value = value.abs();

    for (let n: number = 0; n < prefixes.length; n++) {
      if (value.lessThan(this._prefixThreshold)) {
        return prefixes[n];
      }

      value = value.dividedBy(1000);
    }

    return EnergyUnitPrefix.Tera;
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

  private _renderEnergyState(state: number, units: string, overridePrefix: EnergyUnitPrefix | undefined = undefined): string {
    if (state === null || state < 0) {
      return localize("common.unknown");
    }

    const getDisplayPrecisionForEnergyState = (state: Decimal): number => state.lessThan(10) ? this._displayPrecisionUnder10 : state.lessThan(100) ? this._displayPrecisionUnder100 : this._displayPrecision;

    let stateAsDecimal = new Decimal(state);
    let decimals: number;
    let unitPosition: UnitPosition = this._energyUnitPosition;

    if (units === "%") {
      overridePrefix = EnergyUnitPrefix.None;
      unitPosition = UnitPosition.After;
    } else if (!overridePrefix) {
      overridePrefix = this._calculateEnergyUnitPrefix(stateAsDecimal);
    }

    const prefixes: string[] = Object.values(EnergyUnitPrefix);
    const divisor: number = 1000 ** prefixes.indexOf(overridePrefix);
    stateAsDecimal = stateAsDecimal.dividedBy(divisor);
    decimals = getDisplayPrecisionForEnergyState(stateAsDecimal);
    const formattedValue = formatNumber(stateAsDecimal.toDecimalPlaces(decimals).toString(), this.hass.locale);
    return this._formatState(formattedValue, overridePrefix + units, unitPosition);
  }

  //================================================================================================================================================================================//

  private _renderState(config: SecondaryInfoConfig, entityId: string, state: number, deviceClass: string | undefined = undefined): string {
    if (state === null) {
      return localize("common.unknown");
    }

    if ((deviceClass ?? this.hass.states[entityId].attributes.device_class) === DEVICE_CLASS_ENERGY) {
      return this._renderEnergyState(state, this._energyUnits);
    }

    const units: string | undefined = getConfigValue([config], [SecondaryInfoOptions.Units]) || this.hass.states[entityId].attributes.unit_of_measurement;
    const decimals: number = getConfigValue([config], [SecondaryInfoOptions.Display_Precision]) ?? this.hass["entities"][entityId].display_precision;
    const isCurrencyDevice: boolean = (deviceClass ?? this.hass.states[entityId].attributes.device_class) === DEVICE_CLASS_MONETARY;
    let formattedValue: string;

    if (isCurrencyDevice) {
      formattedValue = formatNumber(new Decimal(state).toFixed(decimals), this.hass.locale);
    } else {
      formattedValue = formatNumber(new Decimal(state).toDecimalPlaces(decimals).toString(), this.hass.locale);
    }

    // TODO: see if this can be sorted out with the appropriate default here
    return this._formatState(formattedValue, units, getConfigValue([config], [SecondaryInfoOptions.Unit_Position]));
  }

  //================================================================================================================================================================================//

  private _handleKeyDown = (target: string | undefined): any => {
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

  private _handleClick = (target: string | undefined): any => {
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

    this.dispatchEvent(e);
  };

  //================================================================================================================================================================================//

  private _renderSecondarySpan(secondary: SecondaryInfoState, state: number, cssClass: string): TemplateResult {
    if (!secondary.isPresent || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const entityId: string = secondary.firstImportEntity!;

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
        ? getConfigValue(this._configs, [EditorPages.Grid, PowerOutageOptions.Power_Outage, PowerOutageOptions.Icon_Alert]) || "mdi:transmission-tower-off"
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
              ${this._renderEnergyState(gridToGrid, this._energyUnits, EnergyUnitPrefix.None)}
            </span>
            `
        : ``}
            ${!this._entityStates.grid.powerOutage.isOutage && (this._showZeroStates || gridFromGrid !== 0)
        ? html`
            <span class="consumption">
              <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>
              ${this._renderEnergyState(gridFromGrid, this._energyUnits, EnergyUnitPrefix.None)}
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

      if (this._useHassStyles) {
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

  private _calculateLayout(): void {
    const width: number = this._getPropertyValue(".lines", "width");

    if (width !== this._width) {
      this._width = width;

      if (width > 0) {
        const numColumns: number = this._getNumColumns();
        const maxCircleSize: number = Math.max(CIRCLE_SIZE_MIN, Math.floor((width - (numColumns - 1) * getColSpacing(CIRCLE_SIZE_MIN).min) / numColumns));
        const circleSize: number = Math.min(maxCircleSize, this._calculateCircleSize());
        this._circleSize = circleSize;
        setLayout(this.style, circleSize);

        const colSpacing: MinMax = getColSpacing(circleSize);

        const rowSpacing: number = Math.round(circleSize * 3 / 8);
        const flowLineCurved: number = circleSize / 2 + rowSpacing - FLOW_LINE_SPACING;
        const flowLineCurvedControl: number = Math.round(flowLineCurved / 3);

        const isTopRowPresent: boolean = (this._entityStates.lowCarbon.isPresent && this._entityStates.grid.isPresent) || this._entityStates.solar.isPresent || this._entityStates.gas.isPresent;
        const columnSpacing: number = Math.max(colSpacing.min, (width - numColumns * circleSize) / (numColumns - 1));
        const textLineHeight: number = this._getPropertyValue(".label", "line-height");

        const battery: boolean = !!this._entityStates.battery.firstExportEntity;
        const grid: boolean = !!this._entityStates.grid.firstImportEntity;
        const solar: boolean = this._entityStates.solar.isPresent;

        const col1X: number = circleSize - DOT_DIAMETER;
        const col2X: number = circleSize + columnSpacing + circleSize / 2;
        const col3X: number = circleSize + columnSpacing + circleSize + columnSpacing + DOT_DIAMETER;

        const row1Y: number = circleSize + textLineHeight - DOT_DIAMETER;
        const row2Y: number = (isTopRowPresent ? circleSize + textLineHeight + rowSpacing : 0) + circleSize / 2;
        const row3Y: number = (isTopRowPresent ? circleSize + textLineHeight + rowSpacing : 0) + circleSize + rowSpacing + DOT_DIAMETER;

        const topRowLineLength: number = Math.round((row2Y - circleSize / 2 + DOT_DIAMETER) - row1Y);
        const horizLineLength: number = Math.round(col3X - col1X);
        const vertLineLength: number = Math.round(row3Y - row1Y);
        const curvedLineLength: number = row2Y - flowLineCurved - FLOW_LINE_SPACING * (grid ? 1 : battery ? 0.5 : 0) - row1Y
          + this._cubicBezierLength({ x: 0, y: 0 }, { x: 0, y: flowLineCurved }, { x: flowLineCurvedControl, y: flowLineCurved }, { x: flowLineCurved, y: flowLineCurved })
          + col3X - flowLineCurved - (col2X + FLOW_LINE_SPACING * (battery ? 1 : grid ? 0.5 : 0));

        const maxLineLength: number = Math.max(topRowLineLength, horizLineLength, vertLineLength, curvedLineLength);

        this._pathScaleFactors = {
          horizLine: horizLineLength / maxLineLength,
          vertLine: vertLineLength / maxLineLength,
          curvedLine: curvedLineLength / maxLineLength,
          topRowLine: topRowLineLength / maxLineLength
        };

        this._solarToBatteryPath = `M${col2X},${row1Y} v${vertLineLength}`;
        this._gridToHomePath = `M${col1X},${row2Y} h${horizLineLength}`;
        this._lowCarbonToGridPath = `M${circleSize / 2},${row1Y} v${topRowLineLength}`;
        this._gasToHomePath = `M${circleSize + columnSpacing + circleSize + columnSpacing + circleSize / 2},${row1Y} v${topRowLineLength}`;

        this._solarToHomePath = `M${col2X + FLOW_LINE_SPACING * (battery ? 1 : grid ? 0.5 : 0)},${row1Y}
                               V${row2Y - flowLineCurved - FLOW_LINE_SPACING * (grid ? 1 : battery ? 0.5 : 0)}
                               c0,${flowLineCurved} ${flowLineCurvedControl},${flowLineCurved} ${flowLineCurved},${flowLineCurved}
                               H${col3X}`;

        this._solarToGridPath = `M${col2X - FLOW_LINE_SPACING * (battery ? 1 : 0.5)},${row1Y}
                               V${row2Y - flowLineCurved - FLOW_LINE_SPACING}
                               c0,${flowLineCurved} ${-flowLineCurvedControl},${flowLineCurved} ${-flowLineCurved},${flowLineCurved}
                               H${col1X}`;

        this._batteryToHomePath = `M${col2X + FLOW_LINE_SPACING * (solar ? 1 : grid ? 0.5 : 0)},${row3Y}
                                 V${row2Y + flowLineCurved + FLOW_LINE_SPACING * (grid ? 1 : solar ? 0.5 : 0)}
                                 c0,${-flowLineCurved} ${flowLineCurvedControl},${-flowLineCurved} ${flowLineCurved},${-flowLineCurved}
                                 H${col3X}`;

        this._batteryToGridPath = `M${col2X - FLOW_LINE_SPACING * (solar ? 1 : 0.5)},${row3Y}
                                 V${row2Y + flowLineCurved + FLOW_LINE_SPACING}
                                 c0,${-flowLineCurved} ${-flowLineCurvedControl},${-flowLineCurved} ${-flowLineCurved},${-flowLineCurved}
                                 H${col1X}`;

        this._gridToBatteryPath = `M${col1X},${row2Y + FLOW_LINE_SPACING}
                                 H${col2X - flowLineCurved - FLOW_LINE_SPACING * (solar ? 1 : 0.5)}
                                 c${flowLineCurvedControl * 2},0 ${flowLineCurved},0 ${flowLineCurved},${flowLineCurved}
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
    const gasSourceMode: GasSourcesMode = getGasSourcesMode(this._config, states);
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

    return FLOW_RATE_MIN + (1 - (value / total)) * (FLOW_RATE_MAX - FLOW_RATE_MIN) * scale;
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
    let tValues: number[] = [-.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816];
    let cValues: number[] = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472];

    let n: number = tValues.length;
    let sum: number = 0;

    for (let i: number = 0; i < n; i++) {
      let ct = t2 * tValues[i] + t2,
        xbase = base3(ct, p0.x, cp1.x, cp2.x, p1.x),
        ybase = base3(ct, p0.y, cp1.y, cp2.y, p1.y),
        comb = xbase * xbase + ybase * ybase;
      sum += cValues[i] * Math.sqrt(comb);
    }

    return t2 * sum;
  }

  //================================================================================================================================================================================//

  private _calculateCircleSize = (): number => {
    if (this._useHassStyles) {
      return CIRCLE_SIZE_MIN;
    }

    const fontHeight: number = this._getPropertyValue(".value", "line-height");
    const volumeUnits: string = this._getVolumeUnits();
    const units: string = this._energyUnits.length > volumeUnits.length ? this._energyUnits : volumeUnits;

    const numChars: number = Math.max(
      this._renderEnergyState(9.9999, units).length,
      this._renderEnergyState(99.9999, units).length,
      this._renderEnergyState(999.9999, units).length,
      this._renderEnergyState(9999.9999, units).length
    );

    const textLineHeight: number = fontHeight + ICON_PADDING;
    const numTextLines: number = 1 + this._hasSecondPrimaryState() + this._hasSecondaryState();

    const width: number = (numChars * fontHeight * 60 / 100) + this._getPropertyValue(".small", "width") + ICON_PADDING;
    const height: number = Math.ceil(numTextLines * textLineHeight + this._getPropertyValue(".entity-icon", "height") + ICON_PADDING * 2);

    return Math.max(CIRCLE_SIZE_MIN, Math.ceil(Math.sqrt(width * width + height * height)) + CIRCLE_STROKE_WIDTH_SEGMENTS * 2);
  }

  //================================================================================================================================================================================//

  private _hasSecondPrimaryState = (): number => {
    const gasSources: GasSourcesMode = getConfigValue(this._configs, [EditorPages.Home, HomeOptions.Gas_Sources]);

    if (gasSources === GasSourcesMode.Show_Separately || gasSources === GasSourcesMode.Automatic) {
      return 1;
    }

    if (getConfigValue(this._configs, [EditorPages.Low_Carbon, GlobalOptions.Options, LowCarbonOptions.Low_Carbon_Mode]) === LowCarbonDisplayMode.Both) {
      return 1;
    }

    const dualPrimaries: DualValueNodeConfig[] = [
      this._config?.[EditorPages.Battery]!,
      this._config?.[EditorPages.Grid]!,

      // TODO: devices
    ];

    for (let n: number = 0; n < dualPrimaries.length; n++) {
      const dualPrimary: DualValueNodeConfig = dualPrimaries[n]!;

      if (dualPrimary?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids]?.length !== 0 && dualPrimary?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids]?.length !== 0) {
        return 1;
      }
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _hasSecondaryState = (): number => {
    const secondaries: SecondaryInfoConfig[] = [
      this._config?.[EditorPages.Battery]?.[EntitiesOptions.Secondary_Info]!,
      this._config?.[EditorPages.Gas]?.[EntitiesOptions.Secondary_Info]!,
      this._config?.[EditorPages.Grid]?.[EntitiesOptions.Secondary_Info]!,
      this._config?.[EditorPages.Home]?.[EntitiesOptions.Secondary_Info]!,
      this._config?.[EditorPages.Low_Carbon]?.[EntitiesOptions.Secondary_Info]!,
      this._config?.[EditorPages.Solar]?.[EntitiesOptions.Secondary_Info]!,

      // TODO: devices
    ];

    for (let n: number = 0; n < secondaries.length; n++) {
      if (secondaries[n]?.[EntityOptions.Entity_Id]) {
        return 1;
      }
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _getPropertyValue = (selector: string, property: string): number => {
    const element: Element | null | undefined = this?.shadowRoot?.querySelector(selector);

    if (element) {
      return parseFloat(getComputedStyle(element).getPropertyValue(property).replace("px", ""));
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _getVolumeUnits = (): string => this._volumeUnits === VolumeUnits.Same_As_Electric ? this._energyUnits : this._volumeUnits;

  //================================================================================================================================================================================//
}
