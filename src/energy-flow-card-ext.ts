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
import { LowCarbonDisplayMode, UnitPrefixes, CssClass, SIUnitPrefixes, InactiveFlowsMode, GasSourcesMode, Scale, PrefixThreshold, EnergyUnits, VolumeUnits, checkEnumValue, DateRange, DateRangeDisplayMode, EnergyType } from "@/enums";
import { EDITOR_ELEMENT_NAME } from "@/ui-editor/ui-editor";
import { CARD_NAME, CIRCLE_STROKE_WIDTH_SEGMENTS, DOT_RADIUS, ICON_PADDING } from "@/const";
import { EnergyFlowCardExtConfig, AppearanceOptions, EditorPages, GlobalOptions, FlowsOptions, EnergyUnitsOptions, EnergyUnitsConfig, HomeOptions, LowCarbonOptions } from "@/config";
import { getRangePresetName, renderDateRange } from "@/ui-helpers/date-fns";
import { AnimationDurations, FlowLine, getGasSourcesMode } from "@/ui-helpers";
import { mdiArrowDown, mdiArrowUp, mdiArrowLeft, mdiArrowRight } from "@mdi/js";
import { titleCase } from "title-case";
import { repeat } from "lit/directives/repeat.js";
import { Node, NodeContentRenderFn } from "@/nodes/node";
import { DeviceNode } from "@/nodes/device";
import equal from "fast-deep-equal";
import memoizeOne from "memoize-one";
import { SecondaryInfo } from "@/nodes/secondary-info";

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

  private _gridToHomePath: string = "";
  private _solarToBatteryPath: string = "";
  private _solarToHomePath: string = "";
  private _solarToGridPath: string = "";
  private _batteryToHomePath: string = "";
  private _gridToBatteryPath: string = "";
  private _gasToHomePath: string = "";
  private _lowCarbonToGridPath: string = "";
  private _devicePaths: string[] = [];
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

    this._render.clear();
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

    const padding: number = this._getPropertyValue("ha-card", "--ha-space-4");
    const width: number = this._getPropertyValue("ha-card", "width") - padding * 2;
    this._getDashboardTitle(this._dashboardLink);

    return html`
      <ha-card .header=${getConfigValue(this._configs, GlobalOptions.Title)}>
        ${this._render(width, entityStates.getStates())}

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
        : nothing}
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
          : nothing}
    `;
  }

  //================================================================================================================================================================================//

  private _render = memoizeOne((width: number, states?: States): TemplateResult => {
    this._calculateLayout(width);

    const electricUnitPrefix: SIUnitPrefixes | undefined = states && this._electricUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestElectricValue)) : undefined;
    const gasUnitPrefix: SIUnitPrefixes | undefined = states && this._gasUnitPrefixes === UnitPrefixes.Unified ? this._calculateEnergyUnitPrefix(new Decimal(states.largestGasValue)) : undefined;
    const animationDurations: AnimationDurations | undefined = states ? this._calculateAnimationDurations(states) : undefined;

    return html`
      <div class="card-content" id=${CARD_NAME}>
        <!-- date-range -->
        ${this._renderDateRange()}

        <!-- flow lines -->
        ${this._renderFlowLines(states, animationDurations)}

        <!-- nodes -->
        ${this._renderGrid(states, electricUnitPrefix, gasUnitPrefix)}
      </div>
    `;
  },
    (newInputs: unknown[], lastInputs: unknown[]): boolean => {
      return this._layoutGrid.length !== 0 &&
        newInputs[0] === lastInputs[0] &&
        newInputs[1] !== undefined && equal(newInputs[1], lastInputs[1]);
    }
  );

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
      this._renderBiDiFlowLine(
        lines,
        this._gridToBatteryPath,
        flows?.gridToBattery,
        flows?.batteryToGrid,
        animationDurations?.gridToBattery,
        animationDurations?.batteryToGrid,
        CssClass.Grid_Import,
        CssClass.Grid_Export,
        CssClass.Battery_Import,
        CssClass.Battery_Export,
        CssClass.Grid_Battery_Anim,
        "--grid-battery-anim-duration"
      );
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

    entityStates.devices.forEach((device, index) => {
      let flow1: number | undefined;
      let flow2: number | undefined;
      let duration1: number | undefined;
      let duration2: number | undefined;
      const cssImport: CssClass = `import-${device.cssClass}` as CssClass;
      const cssExport: CssClass = `export-${device.cssClass}` as CssClass;

      if (device.type === EnergyType.Electric) {
        flow1 = states?.devicesElectric[index].import;
        flow2 = states?.devicesElectric[index].export;
        duration1 = animationDurations?.devicesToHomeElectric[index];
        duration2 = animationDurations?.homeToDevicesElectric[index];
      } else {
        flow1 = states?.devicesGas[index].import;
        flow2 = states?.devicesGas[index].export;
        duration1 = animationDurations?.devicesToHomeGas[index];
        duration2 = animationDurations?.homeToDevicesGas[index];
      }

      this._renderBiDiFlowLine(
        lines,
        this._devicePaths[index],
        flow1,
        flow2,
        duration1,
        duration2,
        cssImport,
        cssExport,
        cssExport,
        cssImport,
        `device-${index}-home-anim` as CssClass,
        `--device-${index}-home-anim-duration`
      );
    });

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

  private _renderBiDiFlowLine(
    lines: FlowLine[],
    path: string,
    flowNode1ToNode2: number = 0,
    flowNode2ToNode1: number = 0,
    durationNode1ToNode2: number = 0,
    durationNode2ToNode1: number = 0,
    cssNode1Import: CssClass,
    cssNode1Export: CssClass,
    cssNode2Import: CssClass,
    cssNode2Export: CssClass,
    cssAnim: CssClass,
    cssAnimVariable: string
  ): void {

    const active1To2: boolean = flowNode1ToNode2 > 0;
    const active2To1: boolean = flowNode2ToNode1 > 0;

    let css1To2Path: CssClass | undefined = undefined;
    let css2To1Path: CssClass | undefined = undefined;
    let css1To2Dot: CssClass = cssNode2Export;
    let css2To1Dot: CssClass = cssNode1Export;

    if (!active1To2 && !active2To1) {
      css1To2Path = CssClass.Inactive;
    } else if (this._useHassStyles) {
      css1To2Path = css2To1Path = active2To1 ? cssNode1Export : cssNode1Import;
      css1To2Dot = cssNode1Import;
    } else if (!active1To2 && active2To1) {
      css2To1Path = cssNode2Export;
    } else if (!active2To1 && active1To2) {
      css1To2Path = cssNode2Export;
    } else if (this._animationEnabled) {
      this.style.setProperty(cssAnimVariable, `${Math.max(Math.abs(durationNode1ToNode2), Math.abs(durationNode2ToNode1)) * 2}s`);
      css1To2Path = cssAnim;
      css2To1Path = CssClass.Hidden_Path
    } else {
      css1To2Path = flowNode1ToNode2 > flowNode2ToNode1 ? cssNode2Export : cssNode1Export;
      css2To1Path = CssClass.Hidden_Path
    }

    if (css1To2Path && cssNode1Import !== CssClass.None && cssNode2Export !== CssClass.None) {
      lines.push({
        cssLine: css1To2Path,
        cssDot: css1To2Dot,
        path: path,
        active: active1To2,
        animDuration: durationNode1ToNode2
      });
    }

    if (css2To1Path && cssNode2Import !== CssClass.None && cssNode1Export != CssClass.None) {
      lines.push({
        cssLine: css2To1Path,
        cssDot: css2To1Dot,
        path: path,
        active: active2To1,
        animDuration: -durationNode2ToNode1
      });
    }
  }

  //================================================================================================================================================================================//

  private _getFontSize(): number {
    const dummy = this.shadowRoot?.ownerDocument.createElement("div")!;
    this.shadowRoot?.ownerDocument.body.append(dummy);
    dummy.style.height = "var(--ha-font-size-s)";
    const fontSize: number = dummy.getBoundingClientRect().height;
    dummy.remove();
    return fontSize;
  }

  //================================================================================================================================================================================//

  private _doDeviceLayout(width: number, circleSize: number, minColSpacing: number): number {
    const entityStates: EntityStates = this._entityStates;
    const numDeviceColumns: number = this._getNumDeviceColumns();
    const maxDeviceColumns: number = Math.floor((width - circleSize) / (circleSize + minColSpacing)) - 2;

    const devicesLayout: DevicesLayout = entityStates.devices.length === 0
      ? DevicesLayout.None
      : numDeviceColumns === 0
        ? entityStates.gas.isPresent
          ? DevicesLayout.Inline_Below
          : DevicesLayout.Inline_Above
        : numDeviceColumns <= maxDeviceColumns
          ? DevicesLayout.Horizontal
          : DevicesLayout.Vertical;

    this._devicesLayout = devicesLayout;
    return NUM_DEFAULT_COLUMNS + (devicesLayout === DevicesLayout.Horizontal ? numDeviceColumns : 0);
  }

  //================================================================================================================================================================================//

  private _calculateLayout(cardWidth: number): void {
    const entityStates: EntityStates = this._entityStates;
    const fontSize: number = this._getFontSize();
    const labelHeight: number = fontSize * this._getPropertyValue("ha-card", "--ha-line-height-normal");
    const circleSize: number = this._calculateCircleSize(fontSize, cardWidth);
    this._circleSize = circleSize;

    const columnSpacingRange: MinMax = this._getColSpacing(circleSize);
    const numColumns: number = this._doDeviceLayout(cardWidth, circleSize, columnSpacingRange.min);
    this._setLayout(this.style, circleSize, numColumns);

    const devicesLayout = this._devicesLayout;
    this._buildLayoutGrid(devicesLayout);

    const maxContentWidth: number = circleSize + (circleSize + columnSpacingRange.max) * numColumns;
    const layoutWidth: number = Math.min(cardWidth, maxContentWidth);

    const rowSpacing: number = this._getRowSpacing(circleSize);
    const colSpacing: number = Math.max(columnSpacingRange.min, (layoutWidth - numColumns * circleSize) / (numColumns - 1));

    const colPitch: number = circleSize + colSpacing;
    const col1: number = circleSize / 2;
    const col2: number = col1 + colPitch;
    const col3: number = col2 + colPitch;

    const rowPitch: number = circleSize + rowSpacing;
    const isTopRowPresent: boolean = (entityStates.lowCarbon.isPresent && entityStates.grid.isPresent) || entityStates.solar.isPresent || entityStates.gas.isPresent || devicesLayout === DevicesLayout.Horizontal || devicesLayout === DevicesLayout.Inline_Above;
    const row1: number = (isTopRowPresent ? labelHeight : 0) + circleSize / 2;
    const row2: number = row1 + rowPitch;
    const row3: number = row2 + rowPitch;

    const lineInset: number = circleSize / 2 - DOT_DIAMETER;
    const rowToRowLineLength: number = Math.round(row2 - row1 - lineInset * 2);
    const colToColLineLength: number = Math.round(col2 - col1 - lineInset * 2);
    const horizLineLength: number = Math.round(col3 - col1 - lineInset * 2);
    const vertLineLength: number = Math.round(row3 - row1 - lineInset * 2);

    const flowLineCurved: number = circleSize / 2 + rowSpacing - FLOW_LINE_SPACING;
    const flowLineCurvedControl: number = Math.round(flowLineCurved / 3);

    const curvedLineLength: number =
      // vertical
      (row2 - flowLineCurved) - (row1 + lineInset)
      // curve
      + this._cubicBezierLength({ x: 0, y: 0 }, { x: 0, y: flowLineCurved }, { x: flowLineCurvedControl, y: flowLineCurved }, { x: flowLineCurved, y: flowLineCurved })
      // horizontal
      + (col2 - flowLineCurved) - (col1 + lineInset);

    let horizLinePresent: boolean;
    let vertLinePresent: boolean;
    let upperLeftLinePresent: boolean;
    let upperRightLinePresent: boolean;
    let lowerLeftLinePresent: boolean;
    let lowerRightLinePresent: boolean;

    if (devicesLayout === DevicesLayout.Vertical) {
      horizLinePresent = !!entityStates.battery.firstImportEntity && !!entityStates.grid.firstExportEntity;
      vertLinePresent = entityStates.solar.isPresent;
      upperLeftLinePresent = entityStates.solar.isPresent && !!entityStates.grid.firstExportEntity;
      upperRightLinePresent = entityStates.solar.isPresent && !!entityStates.battery.firstExportEntity;
      lowerLeftLinePresent = !!entityStates.grid.firstImportEntity;
      lowerRightLinePresent = !!entityStates.battery.firstImportEntity;
    } else {
      horizLinePresent = !!entityStates.grid.firstImportEntity;
      vertLinePresent = entityStates.solar.isPresent && !!entityStates.battery.firstExportEntity;
      upperLeftLinePresent = entityStates.solar.isPresent && !!entityStates.grid.firstExportEntity;
      upperRightLinePresent = entityStates.solar.isPresent;
      lowerLeftLinePresent = !!entityStates.battery.firstImportEntity && !!entityStates.grid.firstExportEntity;
      lowerRightLinePresent = !!entityStates.battery.firstImportEntity;
    }

    const horizLine: string = `M${col1 + lineInset},${row2} h${horizLineLength}`;
    const vertLine: string = `M${col2},${row1 + lineInset} v${vertLineLength}`;

    const upperLeftLine: string = `M${col2 - FLOW_LINE_SPACING * (vertLinePresent ? 1 : upperRightLinePresent ? 0.5 : 0)},${row1 + lineInset}
                               V${row2 - flowLineCurved - FLOW_LINE_SPACING * (horizLinePresent ? 1 : lowerLeftLinePresent ? 0.5 : 0)}
                               c0,${flowLineCurved} ${-flowLineCurvedControl},${flowLineCurved} ${-flowLineCurved},${flowLineCurved}
                               H${col1 + lineInset}`;

    const upperRightLine: string = `M${col2 + FLOW_LINE_SPACING * (vertLinePresent ? 1 : upperLeftLinePresent ? 0.5 : 0)},${row1 + lineInset}
                               V${row2 - flowLineCurved - FLOW_LINE_SPACING * (horizLinePresent ? 1 : lowerRightLinePresent ? 0.5 : 0)}
                               c0,${flowLineCurved} ${flowLineCurvedControl},${flowLineCurved} ${flowLineCurved},${flowLineCurved}
                               H${col3 - lineInset}`;

    const lowerLeftLine: string = `M${col2 - FLOW_LINE_SPACING * (vertLinePresent ? 1 : lowerRightLinePresent ? 0.5 : 0)},${row3 - lineInset}
                                 V${row2 + flowLineCurved + FLOW_LINE_SPACING * (horizLinePresent ? 1 : upperLeftLinePresent ? 0.5 : 0)}
                                 c0,${-flowLineCurved} ${-flowLineCurvedControl},${-flowLineCurved} ${-flowLineCurved},${-flowLineCurved}
                                 H${col1 + lineInset}`;

    const lowerRightLine: string = `M${col2 + FLOW_LINE_SPACING * (vertLinePresent ? 1 : lowerLeftLinePresent ? 0.5 : 0)},${row3 - lineInset}
                                 V${row2 + flowLineCurved + FLOW_LINE_SPACING * (horizLinePresent ? 1 : upperRightLinePresent ? 0.5 : 0)}
                                 c0,${-flowLineCurved} ${flowLineCurvedControl},${-flowLineCurved} ${flowLineCurved},${-flowLineCurved}
                                 H${col3 - lineInset}`;

    // TODO: do something with this?
    const deviceLineLengths: number[] = this._calculateDeviceFlowLines(lineInset, col1, col2, col3, row1, row2, row3, colPitch, rowPitch, rowToRowLineLength);
    const lineLengths: number[] = [rowToRowLineLength, horizLineLength, vertLineLength, curvedLineLength, colToColLineLength, ...deviceLineLengths];

    if (devicesLayout === DevicesLayout.Vertical) {
      this._solarToBatteryPath = upperRightLine;
      this._gridToHomePath = lowerLeftLine;
      this._solarToHomePath = vertLine;
      this._batteryToHomePath = lowerRightLine;
      this._gridToBatteryPath = horizLine;
      this._gasToHomePath = `M${col1 + lineInset},${isTopRowPresent ? row3 : row2} h${colToColLineLength}`;
    } else {
      this._solarToBatteryPath = vertLine;
      this._gridToHomePath = horizLine;
      this._solarToHomePath = upperRightLine;
      this._batteryToHomePath = lowerRightLine;
      this._gridToBatteryPath = lowerLeftLine;
      this._gasToHomePath = `M${col3},${row1 + lineInset} v${rowToRowLineLength}`;
    }

    this._lowCarbonToGridPath = `M${col1},${row1 + lineInset} v${rowToRowLineLength}`;
    this._solarToGridPath = upperLeftLine;
  }

  //================================================================================================================================================================================//

  private _calculateDeviceFlowLines(lineInset: number, col1: number, col2: number, col3: number, row1: number, row2: number, row3: number, colPitch: number, rowPitch: number, rowToRowLineLength: number): number[] {
    const deviceLineLengths: number[] = [];

    switch (this._devicesLayout) {
      case DevicesLayout.Inline_Above:
        this._devicePaths[0] = `M${col3},${row1 + lineInset} v${rowToRowLineLength}`;
        deviceLineLengths[0] = rowToRowLineLength;

        if (this._entityStates.devices.length > 1) {
          this._devicePaths[1] = `M${col3},${row3 - lineInset} v${-rowToRowLineLength}`;
          deviceLineLengths[1] = rowToRowLineLength;
        }
        break;

      case DevicesLayout.Inline_Below:
        this._devicePaths[0] = `M${col3},${row3 - lineInset} v${-rowToRowLineLength}`;
        deviceLineLengths[0] = rowToRowLineLength;
        break;

      case DevicesLayout.Vertical:
        for (let index: number = 0; index < this._entityStates.devices.length; index += 2) {
          const row: number = Math.floor(index / 2) + 1;
          const control1 = 25;
          const control2 = 37.5 + row * 12.5;
          let startX: number = col1 + lineInset;
          const startY = row3 + rowPitch * row;
          const endX: number = col2 - startX;
          const endY: number = row3 - startY;

          this._devicePaths[index] = `M${startX},${startY} c${control1},0 ${control2},0 ${endX},${endY}`;

          startX = col3 - lineInset;
          this._devicePaths[index + 1] = `M${startX},${startY} c${-control1},0 ${-control2},0 ${col2 - startX},${endY}`;

          deviceLineLengths[index] = deviceLineLengths[index + 1] = this._cubicBezierLength({ x: 0, y: 0 }, { x: control1, y: 0 }, { x: control2, y: 0 }, { x: endX, y: endY });
        }
        break;

      case DevicesLayout.Horizontal:
        for (let index: number = 0; index < this._entityStates.devices.length; index += 2) {
          const col: number = Math.floor(index / 2) + 1;
          const control1 = 25;
          const control2 = 37.5 + col * 12.5;
          const startX: number = col3 + colPitch * col;
          let startY: number = row1 + lineInset;
          const endX: number = col3 - startX;
          const endY: number = row2 - startY;

          this._devicePaths[index] = `M${startX},${startY} c0,${control1} 0,${control2} ${endX},${endY}`;

          startY = row3 - lineInset;
          this._devicePaths[index + 1] = `M${startX},${startY} c0,${-control1} 0,${-control2} ${col3 - startX},${-endY}`;

          deviceLineLengths[index] = deviceLineLengths[index + 1] = this._cubicBezierLength({ x: 0, y: 0 }, { x: control1, y: 0 }, { x: control2, y: 0 }, { x: endX, y: endY });
        }
        break;
    }

    return deviceLineLengths;
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
      entityStates.battery.importIcon = mdiArrowUp;
      entityStates.battery.exportIcon = mdiArrowDown;
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
        : this._getNodeRenderFn(entityStates.home.cssClass,
          devicesLayout === DevicesLayout.Inline_Below || (devicesLayout === DevicesLayout.Inline_Above && entityStates.devices.length > 1)
            ? ""
            : entityStates.home.name,
          entityStates.home.render)
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

    const durations: AnimationDurations = {
      batteryToGrid: this._calculateDotRate(flows.batteryToGrid ?? 0, totalFlows),
      batteryToHome: this._calculateDotRate(flows.batteryToHome ?? 0, totalFlows),
      gridToBattery: this._calculateDotRate(flows.gridToBattery ?? 0, totalFlows),
      gridToHome: this._calculateDotRate(flows.gridToHome, totalFlows),
      solarToBattery: this._calculateDotRate(flows.solarToBattery ?? 0, totalFlows),
      solarToGrid: this._calculateDotRate(flows.solarToGrid ?? 0, totalFlows),
      solarToHome: this._calculateDotRate(flows.solarToHome ?? 0, totalFlows),
      lowCarbon: this._calculateDotRate(states.lowCarbon ?? 0, totalFlows),
      gas: this._calculateDotRate(states.gasImport ?? 0, totalFlows + (gasSourceMode === GasSourcesMode.Do_Not_Show ? states.homeGas : 0)),
      devicesToHomeElectric: [],
      devicesToHomeGas: [],
      homeToDevicesElectric: [],
      homeToDevicesGas: []
    };

    states.devicesElectric.forEach((device, index) => {
      durations.devicesToHomeElectric[index] = this._calculateDotRate(device.import ?? 0, totalFlows);
      durations.homeToDevicesElectric[index] = this._calculateDotRate(device.export ?? 0, totalFlows);
    });

    states.devicesGas.forEach((device, index) => {
      durations.devicesToHomeGas[index] = this._calculateDotRate(device.import ?? 0, totalFlows);
      durations.homeToDevicesGas[index] = this._calculateDotRate(device.export ?? 0, totalFlows);
    });

    return durations;
  }

  //================================================================================================================================================================================//

  private _calculateDotRate(value: number, total: number): number {
    if (this._scale === Scale.Logarithmic) {
      value = Math.log(value);
      total = Math.log(total);
    }

    return round(FLOW_RATE_MAX - (value / total) * (FLOW_RATE_MAX - FLOW_RATE_MIN), 1);
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

  private _calculateCircleSize(fontSize: number, cardWidth: number): number {
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

    const maxCircleSize: number = Math.max(CIRCLE_SIZE_MIN, Math.floor((cardWidth - (NUM_DEFAULT_COLUMNS - 1) * this._getColSpacing(CIRCLE_SIZE_MIN).min) / NUM_DEFAULT_COLUMNS));
    return Math.min(maxCircleSize, Math.max(CIRCLE_SIZE_MIN, Math.ceil(Math.sqrt(width * width + height * height)) + CIRCLE_STROKE_WIDTH_SEGMENTS * 2));
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

    const entityStates: EntityStates = this._entityStates;

    const dualPrimaries: Node<any>[] = [
      entityStates.battery,
      entityStates.grid,
      ...entityStates.devices
    ];

    return dualPrimaries.filter(primary => primary.firstExportEntity && primary.firstImportEntity).length !== 0 ? 1 : 0;
  }

  //================================================================================================================================================================================//

  private _hasSecondaryState(): number {
    const entityStates: EntityStates = this._entityStates;

    const secondaries: SecondaryInfo[] = [
      entityStates.battery.secondary,
      entityStates.gas.secondary,
      entityStates.grid.secondary,
      entityStates.home.secondary,
      entityStates.lowCarbon.secondary,
      entityStates.solar.secondary,
      ...entityStates.devices.map(device => device.secondary)
    ];

    return secondaries.filter(secondary => secondary.isPresent).length !== 0 ? 1 : 0;
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

  private _getRowSpacing(circleSize: number): number {
    return Math.round(circleSize * 3 / 8);
  }

  //================================================================================================================================================================================//

  private _setLayout(style: CSSStyleDeclaration, circleSize: number, numColumns: number = NUM_DEFAULT_COLUMNS): void {
    const colSpacing = this._getColSpacing(circleSize);
    const rowSpacing: number = this._getRowSpacing(circleSize);

    style.setProperty("--circle-size", circleSize + "px");
    style.setProperty("--num-columns", numColumns.toString());
    style.setProperty("--row-spacing", rowSpacing + "px");
    style.setProperty("--col-spacing-max", colSpacing.max + "px");
    style.setProperty("--col-spacing-min", colSpacing.min + "px");
  }

  //================================================================================================================================================================================//
}
