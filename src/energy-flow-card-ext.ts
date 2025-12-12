import { CSSResult, html, LitElement, PropertyValues, svg, TemplateResult } from "lit";
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
import { States, Flows, State } from "@/states";
import { EntityStates } from "@/states/entity-states";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { ColourMode, DisplayMode, DotsMode, EntityType, LowCarbonType, InactiveLinesMode, DefaultValues, UnitPosition, UnitPrefixes, CssClass, Orientation, EnergyUnits } from "@/enums";
import { HomeState } from "@/states/home";
import { LowCarbonState } from "@/states/low-carbon";
import { DualValueState, SingleValueState, ValueState } from "@/states/state";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, CIRCLE_RADIUS, DEVICE_CLASS_ENERGY, DEVICE_CLASS_MONETARY } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, EntitiesOptions, GlobalOptions, FlowsOptions, ColourOptions, EnergyUnitsOptions, PowerOutageOptions, EntityOptions, EnergyUnitsConfig, SecondaryInfoConfig, DualValueNodeConfig, BatteryConfig, GridConfig } from "@/config";
import { setDualValueNodeDynamicStyles, setDualValueNodeStaticStyles, setHomeNodeDynamicStyles, setHomeNodeStaticStyles, setSingleValueNodeStyles } from "@/ui-helpers/styles";
import { GasState } from "@/states/gas";
import { repeat } from "lit/directives/repeat.js";
import { renderDot, renderLine, renderSegmentedCircle } from "@/ui-helpers/renderers";
import { SegmentGroup } from "./ui-helpers";

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

const DOT_SIZE_STANDARD: number = 1;
const DOT_SIZE_INDIVIDUAL: number = 2.4;
const DASH_LENGTH: number = 25;

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
  @state() private _width = 0;
  @state() private _loading: boolean = false;

  private _entityStates!: EntityStates;
  private _previousDur: { [name: string]: number } = {};
  private _kiloToMegaThreshold!: Decimal;
  private _wattToKiloThreshold!: Decimal;
  private _megaWattDecimals: number = DefaultValues.MegawattHourDecimals;
  private _kiloWattDecimals: number = DefaultValues.KilowattHourDecimals;
  private _energyUnitPrefixes!: UnitPrefixes;
  private _energyUnitPosition!: UnitPosition;
  private _showZeroStates: boolean = true;
  private _showSegmentGaps: boolean = false;
  private _useHassColours: boolean = true;

  //================================================================================================================================================================================//

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (!this._config || !this.hass) {
      return;
    }

    const elem = this?.shadowRoot?.querySelector("#" + CARD_NAME);
    const widthStr = elem ? getComputedStyle(elem).getPropertyValue("width") : "0px";
    this._width = parseInt(widthStr.replace("px", ""), 10);
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
      throw new Error("At least one entity for battery, gas, grid or solar must be defined");
    }

    this._config = cleanupConfig(this.hass, config);
    this.resetSubscriptions();

    this._showZeroStates = this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Show_Zero_States] ?? true;
    this._showSegmentGaps = this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Segment_Gaps] ?? false;
    this._useHassColours = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Use_HASS_Colours] ?? true;

    const energyUnitsConfig: EnergyUnitsConfig = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Energy_Units]!;
    this._energyUnitPrefixes = energyUnitsConfig?.[EnergyUnitsOptions.Unit_Prefixes] || UnitPrefixes.HASS;
    this._energyUnitPosition = energyUnitsConfig?.[EnergyUnitsOptions.Unit_Position] || UnitPosition.After_Space;
    this._kiloToMegaThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Kwh_Mwh_Threshold] || DefaultValues.KwhMwhThreshold);
    this._wattToKiloThreshold = new Decimal(energyUnitsConfig?.[EnergyUnitsOptions.Wh_Kwh_Threshold] || DefaultValues.WhkWhThreshold);
    this._megaWattDecimals = energyUnitsConfig?.[EnergyUnitsOptions.Mwh_Display_Precision] ?? DefaultValues.MegawattHourDecimals;
    this._kiloWattDecimals = energyUnitsConfig?.[EnergyUnitsOptions.Kwh_Display_Precision] ?? DefaultValues.KilowattHourDecimals;

    setSingleValueNodeStyles(this._config?.[EditorPages.Low_Carbon]!, CssClass.LowCarbon, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Solar]!, CssClass.Solar, this.style);
    setSingleValueNodeStyles(this._config?.[EditorPages.Gas]!, CssClass.Gas, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Grid]!, CssClass.Grid, this.style);
    setHomeNodeStaticStyles(this._config?.[EditorPages.Home]!, this.style);
    setDualValueNodeStaticStyles(this._config?.[EditorPages.Battery]!, CssClass.Battery, this.style);
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

    // show pointer if clickable entities is enabled
    this.style.setProperty("--clickable-cursor", this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Clickable_Entities] ? "pointer" : "default");

    const grid: GridState = this._entityStates.grid;
    const solar: SolarState = this._entityStates.solar;
    const battery: BatteryState = this._entityStates.battery;
    const gas: GasState = this._entityStates.gas;
    const lowCarbon: LowCarbonState = this._entityStates.lowCarbon;
    const states: States = this._entityStates.getStates();
    const flows: Flows = states.flows;
    const electricUnits: string | undefined = this._energyUnitPrefixes === UnitPrefixes.HASS ? this._calculateEnergyUnits(new Decimal(states.largestElectricValue)) : undefined;
    const totalLines = flows.solarToHome + flows.solarToGrid + flows.solarToBattery + flows.gridToHome + flows.gridToBattery + flows.batteryToHome + flows.batteryToGrid;

    const newDur = {
      batteryToGrid: this._circleRate(flows.batteryToGrid ?? 0, totalLines),
      batteryToHome: this._circleRate(flows.batteryToHome ?? 0, totalLines),
      gridToHome: this._circleRate(flows.gridToHome, totalLines),
      gridToBattery: this._circleRate(flows.gridToBattery ?? 0, totalLines),
      solarToBattery: this._circleRate(flows.solarToBattery ?? 0, totalLines),
      solarToGrid: this._circleRate(flows.solarToGrid ?? 0, totalLines),
      solarToHome: this._circleRate(flows.solarToHome ?? 0, totalLines),
      lowCarbon: this._circleRate(states.lowCarbon ?? 0, totalLines),
    };

    ["batteryGrid", "batteryToHome", "gridToHome", "solarToBattery", "solarToGrid", "solarToHome"].forEach(flowName => {
      const flowSVGElement = this[`${flowName}Flow`] as SVGSVGElement;

      if (flowSVGElement && this._previousDur[flowName] && this._previousDur[flowName] !== newDur[flowName]) {
        flowSVGElement.pauseAnimations();
        flowSVGElement.setCurrentTime(flowSVGElement.getCurrentTime() * (newDur[flowName] / this._previousDur[flowName]));
        flowSVGElement.unpauseAnimations();
      }

      this._previousDur[flowName] = newDur[flowName];
    });

    // Adjust Curved Lines
    const isCardWideEnough = this._width > 420;

    if (solar.isPresent) {
      if (battery.isPresent) {
        // has solar, battery and grid
        this.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "106%" : "102%");
        this.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-3%" : "-1%");
        this.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 160px)" : "calc(100% - 160px)");
      } else {
        // has solar but no battery
        this.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "104%" : "102%");
        this.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-2%" : "-1%");
        this.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 154px)" : "calc(100% - 157px)");
        this.style.setProperty("--lines-svg-not-flat-width", isCardWideEnough ? "calc(103% - 172px)" : "calc(103% - 169px)");
      }
    }

    return html`
      <ha-card .header=${this._config?.[GlobalOptions.Title]}>
        <div class="card-content" id=${CARD_NAME}>

        <!-- top row -->
        <div class="row">

          <!-- top left -->
          ${this._config?.[EditorPages.Low_Carbon]?.[GlobalOptions.Options]?.[EntitiesOptions.Low_Carbon_Mode] === LowCarbonType.Percentage
        ? this._renderTopRowNode(lowCarbon, CssClass.LowCarbon, states.lowCarbonPercentage, states.lowCarbonSecondary, "%")
        : this._renderTopRowNode(lowCarbon, CssClass.LowCarbon, states.lowCarbon, states.lowCarbonSecondary, electricUnits)}

          <!-- top middle -->
          ${this._renderTopRowNode(solar, CssClass.Solar, states.solarImport, states.solarSecondary, electricUnits)}

          <!-- top right -->
          ${this._renderTopRowNode(gas, CssClass.Gas, states.gasImport, states.gasSecondary)}

        </div>

        <!-- middle row -->
        <div class="row">

          <!-- middle left -->
          ${this._renderGridNode(states, electricUnits)}

          <!-- middle right -->
          ${this._renderHomeNode(states, electricUnits)}

        </div>

        <!-- bottom row -->
        <div class="row">

          <!-- bottom left -->
          <div class="spacer"></div>

          <!-- bottom middle -->
          ${this._renderBatteryNode(states, electricUnits)}

          <!-- bottom right -->
          <div class="spacer"></div>

        </div>

        <!-- connecting lines -->
        ${this._renderSolarToHomeLine(flows.solarToHome, newDur.solarToHome)}
        ${this._renderSolarToGridLine(flows.solarToGrid, newDur.solarToGrid)}
        ${this._renderSolarToBatteryLine(flows.solarToBattery, newDur.solarToBattery)}
        ${this._renderGridToHomeLine(flows.gridToHome, newDur.gridToHome)}
        ${this._renderBatteryToHomeLine(flows.batteryToHome, newDur.batteryToHome)}
        ${this._renderBatteryGridLine(flows.batteryToGrid, flows.gridToBattery, newDur.batteryToGrid, newDur.gridToBattery)}

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

  private _renderTopRowNode(state: SingleValueState, cssClass: CssClass, primaryState: number, secondaryState: number, energyUnits: string | undefined = undefined): TemplateResult {
    if (!state.isPresent) {
      return html`<div class="spacer"></div>`;
    }

    return html`
      <div class="circle-container top-row ${cssClass}">
        <span class="label">${state.name}</span>
        <div class="circle" @click=${this._handleClick(state.firstMainEntity)} @keyDown=${this._handleKeyDown(state.firstMainEntity)}}>
          ${this._renderSecondarySpan(state.secondary, secondaryState)}
          <ha-icon class="entity-icon" .icon=${state.icon}></ha-icon>
          <span class="${cssClass}">${this._renderEnergyState(primaryState, energyUnits)}</span>
        </div>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderBatteryNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: BatteryState = this._entityStates.battery;

    if (!state.isPresent) {
      return html`<div class="spacer"></div>`;
    }

    const flows: Flows = states.flows;
    const highCarbon: number = 1 - (states.lowCarbonPercentage / 100);

    const segmentGroups: SegmentGroup[] = [
      {
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
      },
      {
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
    ];

    const config: BatteryConfig = this._config[EditorPages.Battery]!;
    setDualValueNodeDynamicStyles(config, CssClass.Battery, states.batteryExport, states.batteryImport, this.style);

    const borderStyle: string = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Dynamic ? "hidden-circle" : "";
    const exportArrow: string = "mdi:arrow-down";
    const importArrow: string = "mdi:arrow-up";

    return html`
      <div class="circle-container ${CssClass.Battery}">
        <div class="circle ${borderStyle}" @click=${this._handleClick(state.firstMainEntity)} @keyDown=${this._handleKeyDown(state.firstMainEntity)}>
          ${config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Dynamic ? renderSegmentedCircle(segmentGroups, CIRCLE_RADIUS, 180, this._showSegmentGaps) : ""}
          ${this._renderSecondarySpan(this._entityStates.battery.secondary, states.batterySecondary)}
          <ha-icon class="entity-icon" .icon=${state.icon}></ha-icon>
          <span class="${CssClass.BatteryExport}">
            <ha-icon class="small arrow-export" .icon=${exportArrow}></ha-icon>
            ${this._renderEnergyState(states.batteryExport, energyUnits)}
          </span>
          <span class="${CssClass.BatteryImport}" @click=${this._handleClick(state.firstReturnEntity)} @keyDown=${this._handleKeyDown(state.firstReturnEntity)}>
            <ha-icon class="small arrow-import" .icon=${importArrow}></ha-icon>
            ${this._renderEnergyState(states.batteryImport, energyUnits)}
          </span>
        </div>
        <span class="label">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderGridNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: GridState = this._entityStates.grid;

    if (!state.isPresent) {
      return html`<div class="spacer"></div>`;
    }

    const flows: Flows = states.flows;

    const segmentGroups: SegmentGroup[] = [
      {
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
      },
      {
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
    ];

    const config: GridConfig = this._config[EditorPages.Grid]!;
    setDualValueNodeDynamicStyles(config, CssClass.Grid, states.gridExport, states.gridImport, this.style);

    const borderStyle: string = config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Dynamic ? "hidden-circle" : "";
    const exportArrow: string = "mdi:arrow-left";
    const importArrow: string = "mdi:arrow-right";

    return html`
      <div class="circle-container ${CssClass.Grid}">
        <div class="circle ${borderStyle}" @click=${this._handleClick(state.firstMainEntity)} @keyDown=${this._handleKeyDown(state.firstMainEntity)}>
          ${config?.[EntitiesOptions.Colours]?.[ColourOptions.Circle] === ColourMode.Dynamic ? renderSegmentedCircle(segmentGroups, CIRCLE_RADIUS, 270, this._showSegmentGaps) : ""}
          ${this._renderSecondarySpan(this._entityStates.grid.secondary, states.gridSecondary)}
          <ha-icon class="entity-icon" .icon=${state.icon}></ha-icon>
          <span class="${CssClass.GridExport}">
            <ha-icon class="small arrow-export" .icon=${exportArrow}></ha-icon>
            ${this._renderEnergyState(states.gridExport, energyUnits)}
          </span>
          <span class="${CssClass.GridImport}" @click=${this._handleClick(state.firstReturnEntity)} @keyDown=${this._handleKeyDown(state.firstReturnEntity)}>
            <ha-icon class="small arrow-import" .icon=${importArrow}></ha-icon>
            ${this._renderEnergyState(states.gridImport, energyUnits)}
          </span>
        </div>
        <span class="label">${state.name}</span>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _renderHomeNode = (states: States, energyUnits: string | undefined = undefined): TemplateResult => {
    const state: HomeState = this._entityStates.home;
    setHomeNodeDynamicStyles(this._config?.[EditorPages.Home]!, states, this.style);

    const flows: Flows = states.flows;
    const totalHomeConsumption: number = Math.max(0, states.home);
    const highCarbonConsumption: number = states.highCarbon * (flows.gridToHome / states.gridImport) || 0;
    const lowCarbonConsumption: number = states.lowCarbon * (flows.gridToHome / states.gridImport) || 0;

    const segmentGroups: SegmentGroup[] = [
      {
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

    return html`
      <div class="circle-container home">
        <div class="circle" @click=${this._handleClick(state.firstMainEntity)} @keyDown=${this._handleKeyDown(state.firstMainEntity)}>
          ${renderSegmentedCircle(segmentGroups, CIRCLE_RADIUS, 0, this._showSegmentGaps)}
          ${this._renderSecondarySpan(state.secondary, states.homeSecondary)}
          <ha-icon class="entity-icon" .icon=${state.icon}></ha-icon>
          <span class="home">${states.home < 0 ? localize("common.unknown") : totalHomeConsumption !== 0 || this._showZeroStates ? this._renderEnergyState(totalHomeConsumption, energyUnits) : ""}</span>
        </div>

        <span class="label">${state.name}</span>
      </div>
    `;
};

  //================================================================================================================================================================================//

  private _circleRate = (value: number, total: number): number => {
    const maxRate = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Max_Rate]!;
    const minRate = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Min_Rate]!;

    if (this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Animation] === DotsMode.Dynamic) {
      const maxEnergy = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Max_Energy]!;
      const minEnergy = this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Min_Energy]!;

      if (value > maxEnergy) {
        return minRate;
      }

      return ((value - minEnergy) * (minRate - maxRate)) / (maxEnergy - minEnergy) + maxRate;
    }

    return maxRate - (value / total) * (maxRate - minRate);
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
    if (state === null) {
      return localize("editor.unknown");
    }

    if (state === 0 && !this._showZeroStates) {
      return "";
    }

    const getDisplayPrecisionForEnergyState = (state: Decimal): number => state.lessThan(10) ? 2 : state.lessThan(100) ? 1 : 0;

    let stateAsDecimal = new Decimal(state);
    let decimals: number;

    if (!units) {
      units = this._calculateEnergyUnits(stateAsDecimal);
    }

    switch (units) {
      case EnergyUnits.MegaWattHours:
        stateAsDecimal = stateAsDecimal.dividedBy(1000000);
        decimals = this._megaWattDecimals;
        break;

      case EnergyUnits.KiloWattHours:
        stateAsDecimal = stateAsDecimal.dividedBy(1000);
        decimals = this._kiloWattDecimals;
        break;

      default:
        decimals = 0;
        break;
    }

    if (this._energyUnitPrefixes === UnitPrefixes.HASS || units === "%") {
      decimals = getDisplayPrecisionForEnergyState(stateAsDecimal);
    }

    const formattedValue = formatNumber(stateAsDecimal.toDecimalPlaces(decimals).toString(), this.hass.locale);
    return this._formatState(formattedValue, units, this._energyUnitPosition);
  }

  //================================================================================================================================================================================//

  private _renderState(config: SecondaryInfoConfig, entityId: string, state: number, deviceClass: string | undefined = undefined): string {
    if (state === null) {
      return "Unknown";
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

  private _entityExists = (hass: HomeAssistant, entityId: string): boolean => entityId in hass.states;

  //================================================================================================================================================================================//

  private _openDetails = (event: { stopPropagation: any; key?: string }, entityId?: string | undefined): void => {
    event.stopPropagation();

    if (!entityId || !this._config?.[EditorPages.Appearance]?.[GlobalOptions.Options]?.[AppearanceOptions.Clickable_Entities]) {
      return;
    }

    // also needs to open details if entity is unavailable, but not if entity doesn't exist in hass states
    if (!this._entityExists(this.hass, entityId)) {
      return;
    }

    const e = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });

    this.dispatchEvent(e);
  };

  //================================================================================================================================================================================//

  private _showLine = (energy: number): boolean => this._config?.[EditorPages.Appearance]?.[AppearanceOptions.Flows]?.[FlowsOptions.Inactive_Lines] === InactiveLinesMode.Normal || energy > 0;

  //================================================================================================================================================================================//

  private _renderSecondarySpan(secondary: SecondaryInfoState, state: number): TemplateResult {
    if (!secondary.isPresent || (state === 0 && !this._showZeroStates)) {
      return html``;
    }

    const entityId: string = secondary.firstMainEntity!;

    state = Math.abs(state) < (secondary.config?.[EntityOptions.Zero_Threshold] ?? 0)
      ? 0
      : state;

    return html`
        <span class="secondary-info" @click=${this._handleClick(entityId)} @keyDown=${(this._handleKeyDown(entityId))}>
          ${secondary.icon ? html`<ha-icon class="secondary-info small" .icon=${secondary.icon}></ha-icon>` : ""}
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
        <div class="circle-container grid">
          <div class="circle" @click=${this._handleClick(this._entityStates.grid.firstMainEntity)} @keyDown=${this._handleKeyDown(this._entityStates.grid.firstMainEntity)}>
          ${this._renderSecondarySpan(this._entityStates.grid.secondary, secondaryState)}
          <ha-icon class="entity-icon" .icon=${gridIcon}></ha-icon>
          ${!this._entityStates.grid.powerOutage.isOutage && (this._showZeroStates || gridToGrid !== 0)
        ? html`
            <span class="return" @click=${this._handleClick(this._entityStates.grid.firstReturnEntity)} @keyDown=${this._handleKeyDown(this._entityStates.grid.firstReturnEntity)}>
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

  private _renderIndividualCircleAtTop = (type: EntityType, entity: ValueState, state: number, secondaryState: number, animDuration: number): TemplateResult => {
    return html`
      <div class="circle-container ${type}">
        <span class="label">${entity.name}</span>
        <div class="circle" @click=${this._handleClick(entity.firstMainEntity)} @keyDown=${this._handleKeyDown(entity.firstMainEntity)}>
          ${this._renderSecondarySpan(entity.secondary, secondaryState)}
          <ha-icon class="entity-icon" .icon=${entity.icon}></ha-icon>
          ${this._showZeroStates || state != 0 ? html`<span class=" ${type}">${this._renderEnergyState(state)}</span>` : ""}
        </div>
        ${this._showLine(state)
        ? html`
          <svg width="80" height="30">
            ${renderLine(type, "M40 30 V-30")}
            ${state != 0 ? html`${renderDot(DOT_SIZE_INDIVIDUAL, type, Math.abs(animDuration), animDuration < 0)}` : ""}
          </svg>
        `
        : ""}
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderIndividualCircleAtBottom = (type: EntityType, entity: ValueState, state: number, animDuration: number): TemplateResult => {
    return html`
      <div class="circle-container ${type}">
        ${this._showLine(state)
        ? html`
          <svg width="80" height="30">
            ${renderLine(type, "M40 0 V30")}
            ${state != 0 ? html`${renderDot(DOT_SIZE_INDIVIDUAL, type, Math.abs(animDuration), animDuration < 0)}` : ""}
          </svg>
        `
        : ""}
        <div class="circle" @click=${this._handleClick(entity.firstMainEntity)} @keyDown=${this._handleKeyDown(entity.firstMainEntity)}>
          ${this._renderSecondarySpan(entity.secondary, 0)}
          <ha-icon class="entity-icon" .icon=${entity.icon}></ha-icon>
          ${this._showZeroStates || state != 0 ? html`<span class=" ${type}">${this._renderEnergyState(state)}</span>` : ""}
        </div>
        <span class="label">${entity.name}</span>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderSolarToHomeLine = (value: number, animDuration: number): TemplateResult => {
    if (!this._entityStates.solar.isPresent || !this._showLine(value ?? 0)) {
      return html``;
    }

    const path: string = `M${this._entityStates.battery.isPresent ? 55 : 53},0 v${this._entityStates.grid.isPresent ? 15 : 17} c0,${this._entityStates.battery.isPresent ? "30 10,30 30,30" : "35 10,35 30,35"} h25`;

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-home-flow">
          ${renderLine(CssClass.Solar, path)}
          ${value !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, CssClass.Solar, animDuration)}` : ""}
        </svg>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderSolarToGridLine = (value: number, animDuration: number): TemplateResult => {
    if (!this._entityStates.solar.isPresent || !this._entityStates.grid.firstReturnEntity || !this._showLine(value ?? 0)) {
      return html``;
    }

    const path: string = `M${this._entityStates.battery.isPresent ? 45 : 47},0 v15 c0,${this._entityStates.battery.isPresent ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-20`;

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-grid-flow">
          ${renderLine(CssClass.GridExport, path)}
          ${value !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, CssClass.GridExport, animDuration)}` : ""}
        </svg>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderSolarToBatteryLine = (value: number, animDuration: number): TemplateResult => {
    if (!this._entityStates.solar.isPresent || !this._entityStates.battery.isPresent || !this._showLine(value ?? 0)) {
      return html``;
    }

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-battery-flow" class="flat-line">
          ${renderLine(CssClass.BatteryExport, "M50,0 V100")}
          ${value !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, CssClass.BatteryExport, animDuration)}` : ""}
        </svg>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderGridToHomeLine = (value: number, animDuration: number): TemplateResult => {
    if (!this._entityStates.grid.isPresent || !this._showLine(value ?? 0)) {
      return html``;
    }

    const path: string = `M0,${this._entityStates.battery.isPresent ? 50 : this._entityStates.solar.isPresent ? 56 : 53} H100`;

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="grid-home-flow" class="flat-line">
          ${renderLine(CssClass.GridImport, path)}
          ${value !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, CssClass.GridImport, animDuration)}` : ""}
        </svg>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderBatteryToHomeLine = (value: number, animDuration: number): TemplateResult => {
    if (!this._entityStates.battery.isPresent || !this._showLine(value ?? 0)) {
      return html``;
    }

    const path: string = `M55,100 v-${this._entityStates.grid.isPresent ? 15 : 17} c0,-30 10,-30 30,-30 h20`;

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-home-flow">
          ${renderLine(CssClass.BatteryImport, path)}
          ${value !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, CssClass.BatteryImport, animDuration)}` : ""}
        </svg>
      </div>
    `;
  };

  //================================================================================================================================================================================//

  private _renderBatteryGridLine = (batteryToGrid: number, gridToBattery: number, animDurationBatteryToGrid: number, animDurationGridToBattery: number): TemplateResult => {
    if (!this._entityStates.grid.isPresent || !this._entityStates.battery.isPresent || !this._showLine(Math.max(gridToBattery, batteryToGrid) ?? 0)) {
      return html``;
    }

    const path: string = "M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20";
    let cssGridToBattery: CssClass;
    let cssBatteryToGrid: CssClass;
    let cssGridToBatteryDot: CssClass = CssClass.BatteryExport;
    let cssBatteryToGridDot: CssClass = CssClass.GridExport;

    if (gridToBattery === 0 && batteryToGrid === 0) {
      cssGridToBattery = cssBatteryToGrid = CssClass.Unknown;
    } else if (this._useHassColours) {
      cssGridToBattery = cssBatteryToGrid = batteryToGrid !== 0 ? CssClass.GridExport : CssClass.GridImport;
      cssGridToBatteryDot = CssClass.GridImport;
    } else if (gridToBattery === 0) {
      cssGridToBattery = cssBatteryToGrid = CssClass.GridExport;
    } else if (batteryToGrid === 0) {
      cssGridToBattery = cssBatteryToGrid = CssClass.BatteryExport;
    } else {
      cssGridToBattery = CssClass.BatteryExport;
      cssBatteryToGrid = CssClass.GridExport;
    }

    return html`
      <div class=${this._getLineCssClasses()}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-grid-flow">
          <path id="grid-battery" class="${cssGridToBattery}" d="${path}" vector-effect="non-scaling-stroke" stroke-dasharray="${DASH_LENGTH}"/>
          <path id="battery-grid" class="${cssBatteryToGrid}" d="${path}" vector-effect="non-scaling-stroke" stroke-dasharray="0 ${DASH_LENGTH} 0"/>
          ${gridToBattery !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, cssGridToBatteryDot, animDurationGridToBattery, true, "grid-battery")}` : ""}
          ${batteryToGrid !== 0 ? html`${renderDot(DOT_SIZE_STANDARD, cssBatteryToGridDot, animDurationBatteryToGrid, false, "grid-battery")}` : ""}
        </svg>
      </div>
  `;
  };

  //================================================================================================================================================================================//

  private _getLineCssClasses = (): string => {
    return "lines" +
      (this._entityStates.battery.isPresent
        ? " high"
        //        : this._individual1.isPresent && this._individual2.isPresent
        //        ? " individual1-individual2"
        : "");
  };
}
