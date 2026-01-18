import { CSSResult, html, LitElement, nothing, PropertyValues, svg, TemplateResult } from "lit";
import { HomeAssistant, LovelaceConfig, LovelaceViewConfig, Panel, round } from "custom-card-helpers";
import { Decimal } from "decimal.js";
import { customElement, property, state } from "lit/decorators.js";
import { cleanupConfig, getConfigValue, DEFAULT_CONFIG, getMinimalConfig, getConfigObjects } from "@/config/config";
import { SubscribeMixin } from "@/energy/subscribe-mixin";
import { localize } from "@/localize/localize";
import { styles } from "@/style";
import { BatteryNode } from "@/nodes/battery";
import { GridNode } from "@/nodes/grid";
import { SolarNode } from "@/nodes/solar";
import { States, Flows } from "@/nodes";
import { DataStatus, EntityStates } from "@/states/entity-states";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { LowCarbonDisplayMode, UnitPrefixes, CssClass, SIUnitPrefixes, InactiveFlowsMode, GasSourcesMode, Scale, PrefixThreshold, EnergyUnits, VolumeUnits, checkEnumValue, DateRange, DateRangeDisplayMode } from "@/enums";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, CIRCLE_STROKE_WIDTH_SEGMENTS, DOT_RADIUS, ICON_PADDING } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, NodeOptions, GlobalOptions, FlowsOptions, EnergyUnitsOptions, EnergyUnitsConfig, SecondaryInfoConfig, HomeOptions, NodeConfig, LowCarbonOptions, EntitiesOptions } from "@/config";
import { getRangePresetName, renderDateRange } from "@/ui-helpers/date-fns";
import { AnimationDurations, FlowLine, getGasSourcesMode, PathScaleFactors } from "@/ui-helpers";
import { mdiArrowDown, mdiArrowUp, mdiArrowLeft, mdiArrowRight } from "@mdi/js";
import { titleCase } from "title-case";
import { repeat } from "lit/directives/repeat.js";
import { NodeContentRenderFn } from "@/nodes/node";
import { DeviceNode } from "./nodes/device";

//================================================================================================================================================================================//

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
}

interface MinMax {
  min: number;
  max: number;
}

function registerCustomCard(params: RegisterCardParams): void {
  const windowWithCards = window as unknown as Window & {
    customCards: unknown[];
  };

  windowWithCards.customCards = windowWithCards.customCards || [];

  windowWithCards.customCards.push({
    ...params,
    preview: false,
    documentationURL: `https://github.com/alex-taylor/energy-flow-card-plus`
  });
}

registerCustomCard({
  type: CARD_NAME,
  name: "Energy Flow Card Extended",
  description: "A custom card for displaying energy flow in Home Assistant. Inspired by the official Energy Distribution Card and Energy Flow Card Plus."
});

//================================================================================================================================================================================//

const NUM_DEFAULT_COLUMNS: number = 3;
const CIRCLE_SIZE_MIN: number = 80;
const DOT_DIAMETER: number = DOT_RADIUS * 2;
const FLOW_LINE_SPACING: number = DOT_DIAMETER + 5;

const FLOW_RATE_MIN: number = 1;
const FLOW_RATE_MAX: number = 6;

const NODE_SPACER: TemplateResult = html`<div class="node-spacer"></div>`;
const HORIZ_SPACER: TemplateResult = html`<div class="horiz-spacer"></div>`;

enum DevicesLayout {
  None,
  Inline_Above,
  Inline_Below,
  Horizontal,
  Vertical
}

type NodeRenderFn = ((nodeClass: CssClass, states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes) => TemplateResult) | undefined;

//================================================================================================================================================================================//

@customElement(CARD_NAME)
export default class EnergyFlowCardPlus extends SubscribeMixin(LitElement) {
  static styles: CSSResult = styles;

  //================================================================================================================================================================================//

  public static getStubConfig(hass: HomeAssistant): Record<string, unknown> {
    return getMinimalConfig(hass);
  }

  //================================================================================================================================================================================//

  public static async getConfigElement(): Promise<HTMLElement> {
    await import("@/ui-editor/ui-editor");
    return document.createElement(EDITOR_ELEMENT_NAME);
  }

  //================================================================================================================================================================================//

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: EnergyFlowCardExtConfig;

  private _width: number = 0;
  private _gridToHomePath: string = "";
  private _solarToBatteryPath: string = "";
  private _solarToHomePath: string = "";
  private _solarToGridPath: string = "";
  private _batteryToHomePath: string = "";
  private _gridToBatteryPath: string = "";
  private _gasToHomePath: string = "";
  private _lowCarbonToGridPath: string = "";
  private _pathScaleFactors: PathScaleFactors = {
    batteryToGrid: 0,
    batteryToHome: 0,
    gridToBattery: 0,
    gridToHome: 0,
    solarToBattery: 0,
    solarToGrid: 0,
    solarToHome: 0,
    lowCarbonToGrid: 0,
    gasToHome: 0
  };

  private _layoutGrid: NodeRenderFn[][] = [];

  private _configs!: EnergyFlowCardExtConfig[];
  private _entityStates!: EntityStates;
  private _dateRange!: DateRange;
  private _dateRangeDisplayMode!: DateRangeDisplayMode;
  private _prefixThreshold!: Decimal;
  private _energyUnits!: string;
  private _electricUnitPrefixes!: UnitPrefixes;
  private _volumeUnits!: string;
  private _gasUnitPrefixes!: UnitPrefixes;
  private _useHassStyles!: boolean;
  private _animationEnabled!: boolean;
  private _scale!: Scale;
  private _dashboardLink!: string;
  private _dashboardLinkLabel!: string;
  private _dashboardLinkTitle: string | undefined = undefined;

  private _inactiveFlowsCss: string = CssClass.Inactive;
  private _circleSize: number = CIRCLE_SIZE_MIN;
  private _devicesLayout: DevicesLayout = DevicesLayout.None;

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
    return [this._entityStates.subscribe(this._config, this.style)];
  }

  //================================================================================================================================================================================//

  public setConfig(config: EnergyFlowCardExtConfig): void {
    if (typeof config !== "object") {
      throw new Error(localize("common.invalid_configuration"));
    }

    this._config = cleanupConfig(config);
    this._configs = [this._config, DEFAULT_CONFIG];
    this.resetSubscriptions();

    this._dateRange = getConfigValue(this._configs, GlobalOptions.Date_Range);
    this._dateRangeDisplayMode = getConfigValue(this._configs, GlobalOptions.Date_Range_Display);

    const appearanceConfig: AppearanceOptions[] = getConfigObjects(this._configs, [EditorPages.Appearance, GlobalOptions.Options]);
    this._useHassStyles = getConfigValue(appearanceConfig, AppearanceOptions.Use_HASS_Style);
    this._dashboardLink = getConfigValue(appearanceConfig, AppearanceOptions.Dashboard_Link);
    this._dashboardLinkLabel = getConfigValue(appearanceConfig, AppearanceOptions.Dashboard_Link_Label);
    this._dashboardLinkTitle = undefined;

    const flowsConfig: FlowsOptions[] = getConfigObjects(this._configs, [EditorPages.Appearance, AppearanceOptions.Flows]);
    this._scale = getConfigValue(flowsConfig, FlowsOptions.Scale, value => checkEnumValue(value, Scale));
    this._animationEnabled = getConfigValue(flowsConfig, FlowsOptions.Animation);

    switch (getConfigValue(flowsConfig, FlowsOptions.Inactive_Flows)) {
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

    const energyUnitsConfig: EnergyUnitsConfig[] = getConfigObjects(this._configs, [EditorPages.Appearance, AppearanceOptions.Energy_Units]);
    this._energyUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Electric_Units, value => checkEnumValue(value, EnergyUnits));
    this._electricUnitPrefixes = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Electric_Unit_Prefixes, value => checkEnumValue(value, UnitPrefixes));
    this._volumeUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Units, value => checkEnumValue(value, VolumeUnits));
    this._gasUnitPrefixes = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Unit_Prefixes, value => checkEnumValue(value, UnitPrefixes));
    this._prefixThreshold = new Decimal(getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Prefix_Threshold, value => checkEnumValue(value, PrefixThreshold)));

    this.style.setProperty("--clickable-cursor", getConfigValue(appearanceConfig, AppearanceOptions.Clickable_Entities) ? "pointer" : "default");
    this.style.setProperty("--inactive-flow-color", this._useHassStyles && this._inactiveFlowsCss !== CssClass.Inactive ? "var(--primary-text-color)" : "var(--disabled-text-color)");

    if (this.style.getPropertyValue("--circle-size") === "") {
      this._setLayout(this.style, CIRCLE_SIZE_MIN);
    }
  }

  //================================================================================================================================================================================//

  protected render(): TemplateResult {
    const entityStates: EntityStates = this._entityStates;

    if (!this._config || !this.hass || !entityStates || !entityStates.isConfigPresent) {
      return html`<ha-card style="padding: 2rem">${localize("common.initialising")}</ha-card>`;
    }

    this._calculateLayout();
    this._getDashboardTitle(this._dashboardLink);

    const states: States | undefined = entityStates.getStates();
    const electricUnitPrefix: SIUnitPrefixes | undefined = states && this._electricUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestElectricValue)) : undefined;
    const gasUnitPrefix: SIUnitPrefixes | undefined = states && this._gasUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestGasValue)) : undefined;
    const animationDurations: AnimationDurations | undefined = states ? this._calculateAnimationDurations(states) : undefined;

    return html`
      <ha-card .header=${getConfigValue(this._configs, GlobalOptions.Title)}>
        <div class="card-content" id=${CARD_NAME}>
          <!-- date-range -->
          ${this._renderDateRange()}

          <!-- flow lines -->
          ${this._renderFlowLines(states, animationDurations)}

          <!-- nodes -->
          ${this._renderGrid(states, electricUnitPrefix, gasUnitPrefix)}
        </div>

        <!-- dashboard link -->
        ${this._dashboardLink && (this._dashboardLinkLabel || this._dashboardLinkTitle)
        ? html`
              <div class="card-actions">
                <a href=${this._dashboardLink}>
                  <mwc-button>
                    ${this._dashboardLinkLabel || localize("common.go_to_dashboard").replace("{title}", this._dashboardLinkTitle!)}
                  </mwc-button>
                </a>
              </div>
              `
        : nothing
      }
      </ha-card>

    <!--error overlays -->
    ${!entityStates.isDatePickerPresent && this._dateRange === DateRange.From_Date_Picker
        ? html`
          <div class="overlay">
            <hr>
            <span class="overlay-message">${localize("common.no_date_picker")}</span>
            <hr>
          </div>
        `
        : entityStates.isDataPresent !== DataStatus.Received
          ? html`
            <div class="overlay">
              <hr>
              <span class="overlay-message">${localize(entityStates.isDataPresent === DataStatus.Requested ? "common.loading" : "common.timed_out")}</span>
              <hr>
            </div>
          `
          : nothing
      }
    `;
  }

  //================================================================================================================================================================================//

  private _renderGrid(states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes): TemplateResult {
    return html`
      ${repeat(this._layoutGrid, _ => _, (row, rowIndex) => {
      return html`
        <div class="row">
          ${repeat(row, _ => _, (nodeRenderFn, columnIndex) => {
        const lastColumnIndex: number = row.length - 1;
        const nodeClass: CssClass = rowIndex === 0 ? CssClass.Top_Row : rowIndex > 1 ? CssClass.Bottom_Row : CssClass.None;
        return html`${nodeRenderFn ? nodeRenderFn(nodeClass, states, overrideElectricPrefix, overrideGasPrefix) : NODE_SPACER}${columnIndex === lastColumnIndex ? nothing : HORIZ_SPACER}`;
      })}
        </div>
      `;
    })}
    `;
  }

  //================================================================================================================================================================================//

  private _getNodeRenderFn(rowClass: CssClass, nodeLabel: string, nodeContentRenderFn: NodeContentRenderFn): NodeRenderFn {
    return (nodeClass: CssClass, states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes) => html`
      <div class="node ${nodeClass} ${rowClass}">
        ${nodeClass === CssClass.Top_Row ? html`<span class="label">${nodeLabel || html`&nbsp;`}</span>` : nothing}
        <div class="circle background">
          ${nodeContentRenderFn!(this, this._circleSize, states, overrideElectricPrefix, overrideGasPrefix)}
        </div>
        ${nodeClass !== CssClass.Top_Row ? html`<span class="label">${nodeLabel || html`&nbsp;`}</span>` : nothing}
      </div>
    `;
  }

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

  private _renderFlowLines(states?: States, animationDurations?: AnimationDurations): TemplateResult {
    const entityStates: EntityStates = this._entityStates;
    const grid: GridNode = entityStates.grid;
    const battery: BatteryNode = entityStates.battery;
    const solar: SolarNode = entityStates.solar;
    const flows: Flows | undefined = states?.flows;
    const lines: FlowLine[] = [];

    if (solar.isPresent) {
      lines.push({
        cssLine: CssClass.Solar,
        cssDot: CssClass.Solar,
        path: this._solarToHomePath,
        active: (flows?.solarToHome ?? 0) > 0,
        animDuration: animationDurations?.solarToHome ?? 0
      });
    }

    if (solar.isPresent && grid.firstExportEntity) {
      lines.push({
        cssLine: CssClass.Grid_Export,
        cssDot: CssClass.Grid_Export,
        path: this._solarToGridPath,
        active: (flows?.solarToGrid ?? 0) > 0,
        animDuration: animationDurations?.solarToGrid ?? 0
      });
    }

    if (solar.isPresent && battery.firstExportEntity) {
      lines.push({
        cssLine: CssClass.Battery_Export,
        cssDot: CssClass.Battery_Export,
        path: this._solarToBatteryPath,
        active: (flows?.solarToBattery ?? 0) > 0,
        animDuration: animationDurations?.solarToBattery ?? 0
      });
    }

    if (grid.firstImportEntity) {
      let cssClass: CssClass;

      if (!this._useHassStyles && this._animationEnabled && (states?.lowCarbon ?? 0) > 0) {
        this.style.setProperty("--grid-to-home-anim-duration", `${(animationDurations?.gridToHome ?? 0) * 2}s`);
        cssClass = CssClass.Grid_To_Home_Anim;
      } else {
        cssClass = CssClass.Grid_Import;
      }

      lines.push({
        cssLine: cssClass,
        cssDot: cssClass,
        path: this._gridToHomePath,
        active: (flows?.gridToHome ?? 0) > 0,
        animDuration: animationDurations?.gridToHome ?? 0
      });
    }

    if (battery.firstImportEntity) {
      lines.push({
        cssLine: CssClass.Battery_Import,
        cssDot: CssClass.Battery_Import,
        path: this._batteryToHomePath,
        active: (flows?.batteryToHome ?? 0) > 0,
        animDuration: animationDurations?.batteryToHome ?? 0
      });
    }

    if (battery.isPresent && grid.isPresent) {
      const gridToBatteryActive: boolean = (flows?.gridToBattery ?? 0) > 0;
      const batteryToGridActive: boolean = (flows?.batteryToGrid ?? 0) > 0;

      let cssGridToBattery: CssClass | undefined = undefined;
      let cssBatteryToGrid: CssClass | undefined = undefined;
      let cssGridToBatteryDot: CssClass = CssClass.Battery_Export;

      if (!gridToBatteryActive && !batteryToGridActive) {
        cssGridToBattery = CssClass.Inactive;
      } else if (this._useHassStyles) {
        cssGridToBattery = cssBatteryToGrid = batteryToGridActive ? CssClass.Grid_Export : CssClass.Grid_Import;
        cssGridToBatteryDot = CssClass.Grid_Import;
      } else if (!gridToBatteryActive && batteryToGridActive) {
        cssBatteryToGrid = CssClass.Grid_Export;
      } else if (!batteryToGridActive && gridToBatteryActive) {
        cssGridToBattery = CssClass.Battery_Export;
      } else if (this._animationEnabled) {
        this.style.setProperty("--grid-battery-anim-duration", `${Math.max((animationDurations?.gridToBattery ?? 0), (animationDurations?.batteryToGrid ?? 0)) * 2}s`);
        cssGridToBattery = CssClass.Grid_Battery_Anim;
        cssBatteryToGrid = CssClass.Hidden_Path
      } else {
        cssGridToBattery = (flows?.gridToBattery ?? 0) > (flows?.batteryToGrid ?? 0) ? CssClass.Battery_Export : CssClass.Grid_Export;
        cssBatteryToGrid = CssClass.Hidden_Path
      }

      if (cssGridToBattery && grid.firstImportEntity && battery.firstExportEntity) {
        lines.push({
          cssLine: cssGridToBattery,
          cssDot: cssGridToBatteryDot,
          path: this._gridToBatteryPath,
          active: gridToBatteryActive,
          animDuration: animationDurations?.gridToBattery ?? 0
        });
      }

      if (cssBatteryToGrid && battery.firstImportEntity && grid.firstExportEntity) {
        lines.push({
          cssLine: cssBatteryToGrid,
          cssDot: CssClass.Grid_Export,
          path: this._gridToBatteryPath,
          active: batteryToGridActive,
          animDuration: animationDurations?.batteryToGrid ?? 0
        });
      }
    }

    if (entityStates.lowCarbon.isPresent && grid.firstImportEntity) {
      lines.push({
        cssLine: CssClass.Low_Carbon,
        cssDot: CssClass.Low_Carbon,
        path: this._lowCarbonToGridPath,
        active: (states?.lowCarbon ?? 0) > 0,
        animDuration: animationDurations?.lowCarbon ?? 0
      });
    }

    if (entityStates.gas.isPresent) {
      lines.push({
        cssLine: CssClass.Gas,
        cssDot: CssClass.Gas,
        path: this._gasToHomePath,
        active: (states?.gasImport ?? 0) > 0,
        animDuration: animationDurations?.gas ?? 0
      });
    }

    const inactiveFlowsMode: InactiveFlowsMode = getConfigValue(this._configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Inactive_Flows]);
    const animationEnabled: boolean = getConfigValue(this._configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Animation]);

    return html`
      <svg class="lines" xmlns="http://www.w3.org/2000/svg">
      ${repeat(lines, _ => undefined, (_, index) => {
      const line: FlowLine = lines[index];
      let cssLine: string = line.cssLine;

      if (!line.active && cssLine !== CssClass.Hidden_Path) {
        switch (inactiveFlowsMode) {
          case InactiveFlowsMode.Dimmed:
            cssLine += " " + CssClass.Dimmed;
            break;

          case InactiveFlowsMode.Greyed:
            cssLine = CssClass.Inactive;
            break;
        }
      }

      return svg`<path class="${cssLine}" d="${line.path}" style="fill: none !important;"></path>`;
    })}

      ${animationEnabled ?
        repeat(lines, _ => undefined, (_, index) => {
          const line: FlowLine = lines[index];

          return svg`
          ${line.active
              ?
              svg`
              <circle r="${DOT_RADIUS}" class="${line.cssDot}">
                <animateMotion path="${line.path}" dur="${Math.abs(line.animDuration)}s" repeatCount="indefinite" calcMode="linear" keyPoints="${line.animDuration < 0 ? '1;0' : '0;1'}" keyTimes="0; 1"></animateMotion>
              </circle>
            `
              : nothing}
        `;
        })
        : nothing}
      </svg>
    `;
  }

  //================================================================================================================================================================================//

  private _calculateLayout(): void {
    const width: number = this._getPropertyValue(".lines", "width");

    if (width !== this._width) {
      this._width = width;

      if (width > 0) {
        const dummy = this.shadowRoot?.ownerDocument.createElement("div")!;
        this.shadowRoot?.ownerDocument.body.append(dummy);
        dummy.style.height = "var(--ha-font-size-s)";
        const fontSize: number = dummy.getBoundingClientRect().height;
        dummy.remove();

        const entityStates: EntityStates = this._entityStates;
        const maxCircleSize: number = Math.max(CIRCLE_SIZE_MIN, Math.floor((width - (NUM_DEFAULT_COLUMNS - 1) * this._getColSpacing(CIRCLE_SIZE_MIN).min) / NUM_DEFAULT_COLUMNS));
        const circleSize: number = Math.min(maxCircleSize, this._calculateCircleSize(fontSize));
        this._circleSize = circleSize;
        this._setLayout(this.style, circleSize);

        const labelHeight: number = fontSize * this._getPropertyValue(".lines", "--ha-line-height-normal");

        const colSpacing: MinMax = this._getColSpacing(circleSize);

        const numDeviceColumns: number = this._getNumDeviceColumns();
        const maxDeviceColumns: number = Math.floor((width - circleSize) / (circleSize + colSpacing.min)) - 2;

        this._devicesLayout = entityStates.devices.length === 0
          ? DevicesLayout.None
          : numDeviceColumns === 0
            ? this._entityStates.gas.isPresent
              ? DevicesLayout.Inline_Below
              : DevicesLayout.Inline_Above
            : numDeviceColumns <= maxDeviceColumns
              ? DevicesLayout.Horizontal
              : DevicesLayout.Vertical;

        this._buildLayoutGrid(this._devicesLayout);

        const numColumns: number = NUM_DEFAULT_COLUMNS + (this._devicesLayout === DevicesLayout.Horizontal ? numDeviceColumns : 0);

        const rowSpacing: number = Math.round(circleSize * 3 / 8);
        const flowLineCurved: number = circleSize / 2 + rowSpacing - FLOW_LINE_SPACING;
        const flowLineCurvedControl: number = Math.round(flowLineCurved / 3);

        const isTopRowPresent: boolean = (this._entityStates.lowCarbon.isPresent && this._entityStates.grid.isPresent) || this._entityStates.solar.isPresent || this._entityStates.gas.isPresent;
        const columnSpacing: number = Math.max(colSpacing.min, (width - numColumns * circleSize) / (numColumns - 1));

        const batteryExport: boolean = !!this._entityStates.battery.firstExportEntity;
        const gridImport: boolean = !!this._entityStates.grid.firstImportEntity;
        const solarImport: boolean = this._entityStates.solar.isPresent;

        const rowPitch: number = circleSize + rowSpacing;
        const topRowHeight: number = labelHeight + rowPitch;

        const col1X: number = circleSize - DOT_DIAMETER;
        const col2X: number = circleSize + columnSpacing + circleSize / 2;
        const col3X: number = circleSize + columnSpacing + circleSize + columnSpacing + DOT_DIAMETER;

        const row1Y: number = labelHeight + circleSize - DOT_DIAMETER;
        const row2Y: number = (isTopRowPresent ? topRowHeight : 0) + circleSize / 2;
        const row3Y: number = (isTopRowPresent ? topRowHeight : 0) + rowPitch + DOT_DIAMETER;

        const topRowLineLength: number = Math.round((row2Y - circleSize / 2 + DOT_DIAMETER) - row1Y);
        const colLineLength: number = Math.round((col2X - circleSize / 2 + DOT_DIAMETER) - col1X);
        const horizLineLength: number = Math.round(col3X - col1X);
        const vertLineLength: number = Math.round(row3Y - row1Y);
        const curvedLineLength: number = row2Y - flowLineCurved - FLOW_LINE_SPACING * (gridImport ? 1 : batteryExport ? 0.5 : 0) - row1Y
          + this._cubicBezierLength({ x: 0, y: 0 }, { x: 0, y: flowLineCurved }, { x: flowLineCurvedControl, y: flowLineCurved }, { x: flowLineCurved, y: flowLineCurved })
          + col3X - flowLineCurved - (col2X + FLOW_LINE_SPACING * (batteryExport ? 1 : gridImport ? 0.5 : 0));

        this._lowCarbonToGridPath = `M${circleSize / 2},${row1Y} v${topRowLineLength}`;

        const horizLine: string = `M${col1X},${row2Y} h${horizLineLength}`;
        const vertLine: string = `M${col2X},${row1Y} v${vertLineLength}`;
        const upperLeftLine: string = `M${col2X - FLOW_LINE_SPACING * (batteryExport ? 1 : 0.5)},${row1Y}
                               V${row2Y - flowLineCurved - FLOW_LINE_SPACING}
                               c0,${flowLineCurved} ${-flowLineCurvedControl},${flowLineCurved} ${-flowLineCurved},${flowLineCurved}
                               H${col1X}`;
        const upperRightLine: string = `M${col2X + FLOW_LINE_SPACING * (batteryExport ? 1 : gridImport ? 0.5 : 0)},${row1Y}
                               V${row2Y - flowLineCurved - FLOW_LINE_SPACING * (gridImport ? 1 : batteryExport ? 0.5 : 0)}
                               c0,${flowLineCurved} ${flowLineCurvedControl},${flowLineCurved} ${flowLineCurved},${flowLineCurved}
                               H${col3X}`;
        const lowerLeftLine: string = `M${col1X},${row2Y + FLOW_LINE_SPACING}
                                 H${col2X - flowLineCurved - FLOW_LINE_SPACING * (solarImport ? 1 : 0.5)}
                                 c${flowLineCurvedControl * 2},0 ${flowLineCurved},0 ${flowLineCurved},${flowLineCurved}
                                 V${row3Y}`;
        const lowerRightLine: string = `M${col2X + FLOW_LINE_SPACING * (solarImport ? 1 : gridImport ? 0.5 : 0)},${row3Y}
                                 V${row2Y + flowLineCurved + FLOW_LINE_SPACING * (gridImport ? 1 : solarImport ? 0.5 : 0)}
                                 c0,${-flowLineCurved} ${flowLineCurvedControl},${-flowLineCurved} ${flowLineCurved},${-flowLineCurved}
                                 H${col3X}`;

        this._solarToGridPath = upperLeftLine;

        const maxLineLength: number = Math.max(topRowLineLength, horizLineLength, vertLineLength, curvedLineLength, colLineLength);
        const pathScaleFactors: PathScaleFactors = this._pathScaleFactors;

        if (this._devicesLayout === DevicesLayout.Vertical) {
          this._solarToBatteryPath = upperRightLine;
          this._gridToHomePath = lowerLeftLine;
          this._solarToHomePath = vertLine;
          this._batteryToHomePath = lowerRightLine;
          this._gridToBatteryPath = horizLine;
          this._gasToHomePath = `M${col1X},${row2Y + rowPitch} h${colLineLength}`;

          pathScaleFactors.gridToHome = pathScaleFactors.solarToGrid = pathScaleFactors.solarToBattery = curvedLineLength / maxLineLength;
          pathScaleFactors.batteryToHome = -pathScaleFactors.gridToHome;
          pathScaleFactors.solarToHome = vertLineLength / maxLineLength;
          pathScaleFactors.gridToBattery = horizLineLength / maxLineLength;
          pathScaleFactors.gasToHome = colLineLength / maxLineLength;
        } else {
          this._solarToBatteryPath = vertLine;
          this._gridToHomePath = horizLine;
          this._solarToHomePath = upperRightLine;
          this._batteryToHomePath = lowerRightLine;
          this._gridToBatteryPath = lowerLeftLine;
          this._gasToHomePath = `M${circleSize + columnSpacing + circleSize + columnSpacing + circleSize / 2},${row1Y} v${topRowLineLength}`;

          pathScaleFactors.gridToBattery = pathScaleFactors.batteryToHome = pathScaleFactors.solarToGrid = pathScaleFactors.solarToHome = curvedLineLength / maxLineLength;
          pathScaleFactors.solarToBattery = vertLineLength / maxLineLength;
          pathScaleFactors.gridToHome = horizLineLength / maxLineLength;
          pathScaleFactors.gasToHome = topRowLineLength / maxLineLength;
        }

        pathScaleFactors.batteryToGrid = -pathScaleFactors.gridToBattery;
        pathScaleFactors.lowCarbonToGrid = topRowLineLength / maxLineLength;
      }
    }
  }

  //================================================================================================================================================================================//

  private _getNumDeviceColumns(): number {
    const numDevices: number = this._entityStates.devices.length;

    if (numDevices <= 1 || (numDevices === 2 && !this._entityStates.gas.isPresent)) {
      return 0;
    }

    return Math.ceil(numDevices / 2);
  }

  //================================================================================================================================================================================//

  private _buildLayoutGrid(devicesLayout: DevicesLayout): void {
    const entityStates: EntityStates = this._entityStates;
    const layoutGrid: NodeRenderFn[][] = [];

    if (devicesLayout === DevicesLayout.Vertical) {
      entityStates.battery.importIcon = mdiArrowLeft;
      entityStates.battery.exportIcon = mdiArrowRight;
    } else {
      entityStates.battery.importIcon = mdiArrowRight;
      entityStates.battery.exportIcon = mdiArrowLeft;
    }

    layoutGrid[0] = [
      entityStates.lowCarbon.isPresent && entityStates.grid.isPresent
        ? this._getNodeRenderFn(entityStates.lowCarbon.cssClass, entityStates.lowCarbon.name, entityStates.lowCarbon.render)
        : undefined,

      entityStates.solar.isPresent
        ? this._getNodeRenderFn(entityStates.solar.cssClass, entityStates.solar.name, entityStates.solar.render)
        : undefined,

      entityStates.gas.isPresent && devicesLayout !== DevicesLayout.Vertical
        ? this._getNodeRenderFn(entityStates.gas.cssClass, entityStates.gas.name, entityStates.gas.render)
        : undefined
    ];

    layoutGrid[1] = [
      entityStates.grid.isPresent
        ? this._getNodeRenderFn(entityStates.grid.cssClass, entityStates.grid.name, entityStates.grid.render)
        : undefined,

      undefined,

      devicesLayout === DevicesLayout.Vertical
        ? entityStates.battery.isPresent
          ? this._getNodeRenderFn(entityStates.battery.cssClass, entityStates.battery.name, entityStates.battery.render)
          : undefined
        : this._getNodeRenderFn(entityStates.home.cssClass, entityStates.home.name, entityStates.home.render)
    ];

    layoutGrid[2] = [
      entityStates.gas.isPresent && devicesLayout === DevicesLayout.Vertical
        ? this._getNodeRenderFn(entityStates.gas.cssClass, entityStates.gas.name, entityStates.gas.render)
        : undefined,

      devicesLayout === DevicesLayout.Vertical
        ? this._getNodeRenderFn(entityStates.home.cssClass, "", entityStates.home.render)
        : entityStates.battery.isPresent
          ? this._getNodeRenderFn(entityStates.battery.cssClass, entityStates.battery.name, entityStates.battery.render)
          : undefined,

      undefined
    ];

    const getDeviceRenderFn = (deviceIndex: number, importIcon: string, exportIcon: string): NodeRenderFn => {
      const device: DeviceNode = entityStates.devices[deviceIndex];
      device.exportIcon = exportIcon;
      device.importIcon = importIcon;
      return this._getNodeRenderFn(device.cssClass, device.name, (target, circleSize, states, overrideElectricPrefix, overrideGasPrefix) => device.render(target, circleSize, states, overrideElectricPrefix, overrideGasPrefix))
    }

    switch (devicesLayout) {
      case DevicesLayout.Inline_Above:
        layoutGrid[0][2] = getDeviceRenderFn(0, mdiArrowDown, mdiArrowUp);

        if (entityStates.devices.length === 2) {
          layoutGrid[2][2] = getDeviceRenderFn(1, mdiArrowUp, mdiArrowDown);
        }
        break;

      case DevicesLayout.Inline_Below:
        layoutGrid[2][2] = getDeviceRenderFn(0, mdiArrowUp, mdiArrowDown);
        break;

      case DevicesLayout.Horizontal:
        for (let n: number = 0, column: number = 3; n < entityStates.devices.length; n++, column++) {
          layoutGrid[0][column] = getDeviceRenderFn(n, mdiArrowDown, mdiArrowUp);
          layoutGrid[1][column] = undefined;
          layoutGrid[2][column] = ++n < entityStates.devices.length ? getDeviceRenderFn(n, mdiArrowUp, mdiArrowDown) : undefined;
        }
        break;

      case DevicesLayout.Vertical:
        for (let n: number = 0, row: number = 3; n < entityStates.devices.length; n++, row++) {
          layoutGrid[row] = [
            getDeviceRenderFn(n, mdiArrowRight, mdiArrowLeft),
            undefined,
            (++n < entityStates.devices.length) ? getDeviceRenderFn(n, mdiArrowLeft, mdiArrowRight) : undefined
          ];
        }
        break;
    }

    this._layoutGrid = layoutGrid;
  }

  //================================================================================================================================================================================//

  private _calculateAnimationDurations(states: States): AnimationDurations {
    const gasSourceMode: GasSourcesMode = getGasSourcesMode(getConfigObjects(this._configs, EditorPages.Home), states);
    const flows: Flows = states.flows;
    const totalFlows: number = states.homeElectric
      + flows.batteryToGrid
      + flows.gridToBattery
      + flows.solarToBattery
      + flows.solarToGrid
      + (gasSourceMode !== GasSourcesMode.Do_Not_Show ? states.homeGas : 0);

    return {
      batteryToGrid: this._calculateDotRate(flows.batteryToGrid ?? 0, totalFlows, this._pathScaleFactors.batteryToGrid),
      batteryToHome: this._calculateDotRate(flows.batteryToHome ?? 0, totalFlows, this._pathScaleFactors.batteryToHome),
      gridToBattery: this._calculateDotRate(flows.gridToBattery ?? 0, totalFlows, this._pathScaleFactors.gridToBattery),
      gridToHome: this._calculateDotRate(flows.gridToHome, totalFlows, this._pathScaleFactors.gridToHome),
      solarToBattery: this._calculateDotRate(flows.solarToBattery ?? 0, totalFlows, this._pathScaleFactors.solarToBattery),
      solarToGrid: this._calculateDotRate(flows.solarToGrid ?? 0, totalFlows, this._pathScaleFactors.solarToGrid),
      solarToHome: this._calculateDotRate(flows.solarToHome ?? 0, totalFlows, this._pathScaleFactors.solarToHome),
      lowCarbon: this._calculateDotRate(states.lowCarbon ?? 0, totalFlows, this._pathScaleFactors.lowCarbonToGrid),
      gas: this._calculateDotRate(states.gasImport ?? 0, totalFlows + (gasSourceMode === GasSourcesMode.Do_Not_Show ? states.homeGas : 0), this._pathScaleFactors.gasToHome)

      // TODO devices
    };
  }

  //================================================================================================================================================================================//

  private _calculateDotRate(value: number, total: number, scale: number): number {
    if (this._scale === Scale.Logarithmic) {
      value = Math.log(value);
      total = Math.log(total);
    }

    return round(FLOW_RATE_MIN + (1 - (value / total)) * (FLOW_RATE_MAX - FLOW_RATE_MIN) * scale, 1);
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
      const t1: number = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4;
      const t2: number = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
      return t * t2 - 3 * p1 + 3 * p2;
    };

    t = t > 1 ? 1 : t < 0 ? 0 : t;

    const t2: number = t / 2;
    const tValues: number[] = [-.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816];
    const cValues: number[] = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472];

    const n: number = tValues.length;
    let sum: number = 0;

    for (let i: number = 0; i < n; i++) {
      const ct: number = t2 * tValues[i] + t2;
      const xbase: number = base3(ct, p0.x, cp1.x, cp2.x, p1.x);
      const ybase: number = base3(ct, p0.y, cp1.y, cp2.y, p1.y);
      const comb: number = xbase * xbase + ybase * ybase;
      sum += cValues[i] * Math.sqrt(comb);
    }

    return t2 * sum;
  }

  //================================================================================================================================================================================//

  private _calculateCircleSize(fontSize: number): number {
    if (this._useHassStyles) {
      return CIRCLE_SIZE_MIN;
    }

    const volumeUnits: string = this._getVolumeUnits();
    const units: string = this._energyUnits.length > volumeUnits.length ? this._energyUnits : volumeUnits;

    const numChars: number = Math.max(
      this._entityStates.home.renderEnergyState(9.999, units).length,
      this._entityStates.home.renderEnergyState(99.999, units).length,
      this._entityStates.home.renderEnergyState(999.999, units).length,
      this._entityStates.home.renderEnergyState(9999.999, units).length
    );

    const textLineHeight: number = fontSize + ICON_PADDING;
    const numTextLines: number = 1 + this._hasSecondPrimaryState() + this._hasSecondaryState();

    const width: number = (numChars * fontSize * 50 / 100) + fontSize + ICON_PADDING;
    const height: number = Math.ceil(numTextLines * textLineHeight + fontSize * 2 + ICON_PADDING * 2);

    return Math.max(CIRCLE_SIZE_MIN, Math.ceil(Math.sqrt(width * width + height * height)) + CIRCLE_STROKE_WIDTH_SEGMENTS * 2);
  }

  //================================================================================================================================================================================//

  private _hasSecondPrimaryState(): number {
    const gasSources: GasSourcesMode = getConfigValue(this._configs, [EditorPages.Home, HomeOptions.Gas_Sources]);

    if (gasSources === GasSourcesMode.Show_Separately || gasSources === GasSourcesMode.Automatic) {
      return 1;
    }

    if (getConfigValue(this._configs, [EditorPages.Low_Carbon, GlobalOptions.Options, LowCarbonOptions.Low_Carbon_Mode]) === LowCarbonDisplayMode.Both) {
      return 1;
    }

    const dualPrimaries: NodeConfig[] = [
      getConfigValue(this._configs, EditorPages.Battery),
      getConfigValue(this._configs, EditorPages.Grid),

      // TODO: devices
    ];

    for (let n: number = 0; n < dualPrimaries.length; n++) {
      const dualPrimary: NodeConfig = dualPrimaries[n]!;
      const importEntities: string[] = getConfigValue(dualPrimary, [NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]);
      const exportEntities: string[] = getConfigValue(dualPrimary, [NodeOptions.Export_Entities, EntitiesOptions.Entity_Ids]);

      if (importEntities.length !== 0 && exportEntities.length !== 0) {
        return 1;
      }
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _hasSecondaryState(): number {
    const secondaries: SecondaryInfoConfig[] = [
      getConfigValue(this._configs, [EditorPages.Battery, NodeOptions.Secondary_Info]),
      getConfigValue(this._configs, [EditorPages.Gas, NodeOptions.Secondary_Info]),
      getConfigValue(this._configs, [EditorPages.Grid, NodeOptions.Secondary_Info]),
      getConfigValue(this._configs, [EditorPages.Home, NodeOptions.Secondary_Info]),
      getConfigValue(this._configs, [EditorPages.Low_Carbon, NodeOptions.Secondary_Info]),
      getConfigValue(this._configs, [EditorPages.Solar, NodeOptions.Secondary_Info]),

      // TODO: devices
    ];

    for (let n: number = 0; n < secondaries.length; n++) {
      if (secondaries[n]) {
        return 1;
      }
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _getPropertyValue(selector: string, property: string): number {
    const element: Element | null | undefined = this?.shadowRoot?.querySelector(selector);

    if (element) {
      return parseFloat(getComputedStyle(element).getPropertyValue(property).replace("px", ""));
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _getVolumeUnits = (): string => this._volumeUnits === VolumeUnits.Same_As_Electric ? this._energyUnits : this._volumeUnits;

  //================================================================================================================================================================================//

  private async _getDashboardTitle(url: string): Promise<string> {
    if (!url || this._dashboardLinkTitle) {
      return "";
    }

    const parts: string[] = url.split("/");

    if (parts.length < 2) {
      return url;
    }

    const dashboardUrl: string = parts[1];
    const panels: Panel[] = Object.values(this.hass.panels).filter(panel => panel.url_path === dashboardUrl);

    if (panels.length === 0) {
      return url;
    }

    let dashboardTitle: string | null = panels[0].title;

    if (!dashboardTitle) {
      return url;
    }

    if (parts.length > 2) {
      const viewUrl: string = parts[2];

      const fetchConfig = (): Promise<LovelaceConfig> =>
        this.hass.connection.sendMessagePromise({
          type: "lovelace/config",
          url_path: dashboardUrl,
          force: true
        });

      await fetchConfig()
        .then(config => {
          const views: LovelaceViewConfig[] = Object.values(config.views).filter(view => view.path == viewUrl);

          if (views.length !== 0) {
            dashboardTitle += "/" + views[0].title;
          }
        });
    }

    this._dashboardLinkTitle = titleCase(dashboardTitle);
    return this._dashboardLinkTitle;
  }

  //================================================================================================================================================================================//

  private _renderDateRange(): TemplateResult {
    if (this._dateRangeDisplayMode === DateRangeDisplayMode.Do_Not_Show || !this._entityStates.periodStart || !this._entityStates.periodEnd) {
      return html``;
    }

    const presetName: boolean = this._dateRangeDisplayMode === DateRangeDisplayMode.Preset_Name || this._dateRangeDisplayMode === DateRangeDisplayMode.Both;
    const dates: boolean = this._dateRangeDisplayMode === DateRangeDisplayMode.Dates || this._dateRangeDisplayMode === DateRangeDisplayMode.Both;
    let text: string = "";

    if (dates) {
      text = renderDateRange(this.hass.locale.language, this._entityStates.periodStart, this._entityStates.periodEnd);
    }

    if (this._dateRange === DateRange.Custom || this._dateRange === DateRange.From_Date_Picker) {
      if (!dates) {
        return html``;
      }
    } else {
      const preset: string = getRangePresetName(this.hass, this._dateRange);

      if (presetName && dates) {
        text = `${preset} (${text})`;
      } else if (presetName) {
        text = `${preset}`;
      }
    }

    return html`
      <div>
        <span class="date-label">${text}</span>
        <hr class="separator"/>
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _getColSpacing(circleSize: number): MinMax {
    return { min: Math.round(circleSize / 10), max: Math.round(circleSize * 5 / 8) }
  }

  //================================================================================================================================================================================//

  private _setLayout(style: CSSStyleDeclaration, circleSize: number): void {
    const colSpacing = this._getColSpacing(circleSize);
    const rowSpacing: number = Math.round(circleSize * 3 / 8);

    style.setProperty("--circle-size", circleSize + "px");
    style.setProperty("--row-spacing", rowSpacing + "px");
    style.setProperty("--col-spacing-max", colSpacing.max + "px");
    style.setProperty("--col-spacing-min", colSpacing.min + "px");
  }

  //================================================================================================================================================================================//
}
