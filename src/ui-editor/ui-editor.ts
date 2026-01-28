import { LitElement, css, html, nothing, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import { assert } from 'superstruct';
import { EditorPages, EnergyFlowCardExtConfig, NodeOptions, EntitiesOptions, GlobalOptions, SecondaryInfoOptions, DeviceConfig, isValidSecondaryEntity, AppearanceOptions, EnergyUnitsOptions } from '@/config';
import { appearanceSchema, dateRangeSchema, generalConfigSchema } from './schema';
import { localize } from '@/localize/localize';
import { gridSchema } from './schema/grid';
import { solarSchema } from './schema/solar';
import { batterySchema } from './schema/battery';
import { lowCarbonSchema } from './schema/low-carbon';
import { homeSchema } from './schema/home';
import { gasSchema } from './schema/gas';
import "./components/date-range-picker";
import "./components/page-header";
import "./components/devices-editor";
import { CARD_NAME } from '@/const';
import { cardConfigStruct } from '@/config/validation';
import { computeHelperCallback, computeLabelCallback, getStatusIcon, Status, STATUS_CLASSES, STATUS_ICONS, validatePrimaryEntities, validateSecondaryEntity } from '.';
import { getDefaultLowCarbonConfig, getDefaultAppearanceConfig, getDefaultGridConfig, getDefaultGasConfig, getDefaultSolarConfig, getDefaultBatteryConfig, getDefaultHomeConfig, getCo2SignalEntity, getConfigValue, populateConfigDefaults, removeConfigDefaults } from '@/config/config';
import { GasNode } from '@/nodes/gas';
import { getEnergyDataCollection } from '@/energy';
import { GridNode } from '@/nodes/grid';
import { SolarNode } from '@/nodes/solar';
import { BatteryNode } from '@/nodes/battery';
import { LowCarbonNode } from '@/nodes/low-carbon';
import { HomeNode } from '@/nodes/home';
import { DeviceNode } from '@/nodes/device';
import { DateRange, DisplayMode, ELECTRIC_ENTITY_CLASSES, GAS_ENTITY_CLASSES } from '@/enums';
import { endOfToday, formatDate, startOfToday } from 'date-fns';
import { EntityRegistryEntry } from '@/hass';
import { Node } from '@/nodes/node';

//================================================================================================================================================================================//

export const EDITOR_ELEMENT_NAME = CARD_NAME + "-editor";

//================================================================================================================================================================================//

function createNode(cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant, type: EditorPages, index?: number): Node<any> | undefined {
  switch (type) {
    case EditorPages.Battery:
      return new BatteryNode(hass, cardConfig, style, undefined, getEnergyDataCollection(hass)?.prefs?.energy_sources || []);

    case EditorPages.Devices:
      return new DeviceNode(hass, cardConfig, style, index!);

    case EditorPages.Gas:
      return new GasNode(hass, cardConfig, style, getEnergyDataCollection(hass)?.prefs?.energy_sources || []);

    case EditorPages.Grid:
      return new GridNode(hass, cardConfig, style, undefined, getEnergyDataCollection(hass)?.prefs?.energy_sources || []);

    case EditorPages.Home:
      return new HomeNode(hass, cardConfig, style);

    case EditorPages.Low_Carbon:
      return new LowCarbonNode(hass, cardConfig, style);

    case EditorPages.Solar:
      return new SolarNode(hass, cardConfig, style, getEnergyDataCollection(hass)?.prefs?.energy_sources || []);
  }

  return undefined;
}

const CONFIG_PAGES: {
  page: EditorPages;
  icon: string;
  schema?: (config: any, mode: DisplayMode, secondaries: string[]) => any[];
  createConfig?;
  statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant) => Status;
}[] = [
    {
      page: EditorPages.Appearance,
      icon: "mdi:cog",
      schema: appearanceSchema,
      createConfig: getDefaultAppearanceConfig,
      statusIcon: () => Status.NotConfigured
    },
    {
      page: EditorPages.Grid,
      icon: "mdi:transmission-tower",
      schema: gridSchema,
      createConfig: getDefaultGridConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Grid)!, ELECTRIC_ENTITY_CLASSES, true)
    },
    {
      page: EditorPages.Gas,
      icon: "mdi:fire",
      schema: gasSchema,
      createConfig: getDefaultGasConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Gas)!, GAS_ENTITY_CLASSES, true)
    },
    {
      page: EditorPages.Solar,
      icon: "mdi:solar-power",
      schema: solarSchema,
      createConfig: getDefaultSolarConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Solar)!, ELECTRIC_ENTITY_CLASSES, true)
    },
    {
      page: EditorPages.Battery,
      icon: "mdi:battery-high",
      schema: batterySchema,
      createConfig: getDefaultBatteryConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Battery)!, ELECTRIC_ENTITY_CLASSES, true)
    },
    {
      page: EditorPages.Low_Carbon,
      icon: "mdi:leaf",
      schema: lowCarbonSchema,
      createConfig: getDefaultLowCarbonConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => {
        const status = getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Low_Carbon)!, ELECTRIC_ENTITY_CLASSES, false);

        if (status !== Status.NotConfigured) {
          return status;
        }

        return getCo2SignalEntity(hass) !== undefined ? Status.Valid : Status.NotConfigured;
      }
    },
    {
      page: EditorPages.Home,
      icon: "mdi:home",
      schema: homeSchema,
      createConfig: getDefaultHomeConfig,
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Home)!, ELECTRIC_ENTITY_CLASSES, false)
    },
    {
      page: EditorPages.Devices,
      icon: "mdi:devices",
      createConfig: () => { },
      statusIcon: (cardConfig: EnergyFlowCardExtConfig, style: CSSStyleDeclaration, hass: HomeAssistant): Status => {
        const deviceConfigs: DeviceConfig[] = getConfigValue(cardConfig, EditorPages.Devices);
        return deviceConfigs?.map((device, index) => getStatusIcon(hass, createNode(cardConfig, style, hass, EditorPages.Devices, index)!, ELECTRIC_ENTITY_CLASSES, true, true)).reduce((previous, current) => current > previous ? current : previous, Status.NotConfigured) || Status.NotConfigured
      }
    }
  ];

//================================================================================================================================================================================//

@customElement(EDITOR_ELEMENT_NAME)
export class EnergyFlowCardExtEditor extends LitElement implements LovelaceCardEditor {
  public get hass(): HomeAssistant {
    return this._hass;
  }
  public set hass(hass: HomeAssistant) {
    this._hass = hass;

    if (!this._secondaryEntities) {
      this._secondaryEntities = Object.values(hass["entities"]).map(entity => (entity as EntityRegistryEntry).entity_id).filter(entityId => isValidSecondaryEntity(hass, entityId));
    }
  }
  private _hass!: HomeAssistant;

  @state() private _config?: EnergyFlowCardExtConfig;
  @state() private _currentConfigPage?: EditorPages;

  private _secondaryEntities: string[] | undefined;

  public async setConfig(config: EnergyFlowCardExtConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = populateConfigDefaults(config, this.hass);

    if (this._config) {
      const threshold: number = getConfigValue(this._config, [EditorPages.Appearance, AppearanceOptions.Energy_Units, EnergyUnitsOptions.Prefix_Threshold]);

      if (threshold !== undefined) {
        this._config[EditorPages.Appearance]![AppearanceOptions.Energy_Units]![EnergyUnitsOptions.Prefix_Threshold] = threshold.toString();
      }
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const config: EnergyFlowCardExtConfig = this._config;
    const currentConfigPage: EditorPages | undefined = this._currentConfigPage;
    const mode: DisplayMode = getConfigValue(config, GlobalOptions.Mode);

    if (currentConfigPage) {
      const schema = CONFIG_PAGES.find(page => page.page === currentConfigPage)?.schema;
      const icon: string | undefined = CONFIG_PAGES.find((page) => page.page === currentConfigPage)?.icon;

      if (!config[currentConfigPage]) {
        config[currentConfigPage] = CONFIG_PAGES.find(page => page.page === currentConfigPage)?.createConfig();
      }

      const configForPage: any = config[currentConfigPage];

      return html`
        <energy-flow-card-ext-page-header
          icon="${icon}"
          label=${localize(`EditorPages.${currentConfigPage}`)}
          @go-back=${this._onGoBack}
        ></energy-flow-card-ext-page-header>

        ${currentConfigPage === EditorPages.Devices
          ? html`
            <energy-flow-card-ext-devices-editor
              .hass=${this.hass}
              .config=${config}
              .mode=${mode}
              .secondaryEntities=${this._secondaryEntities}
              @value-changed=${this._onValueChanged}
            ></energy-flow-card-ext-devices-editor>
          `
          : html`
            <ha-form
              .hass=${this.hass}
              .data=${configForPage}
              .schema=${schema!(config, mode, this._secondaryEntities!)}
              .computeLabel=${computeLabelCallback}
              .computeHelper=${computeHelperCallback}
              .error=${this._validateConfig(config)}
              @value-changed=${this._onValueChanged}
            ></ha-form>
          `
        }
      `;
    }

    const startDateValue: string = getConfigValue(config, GlobalOptions.Date_Range_From);
    const endDateValue: string = getConfigValue(config, GlobalOptions.Date_Range_To);
    const startDate: Date = startDateValue ? new Date(startDateValue) : startOfToday();
    const endDate: Date = endDateValue ? new Date(endDateValue) : endOfToday();

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${config}
          .schema=${generalConfigSchema()}
          .computeLabel=${computeLabelCallback}
          .computeHelper=${computeHelperCallback}
          @value-changed=${this._onValueChanged}
        ></ha-form>

        ${mode === DisplayMode.Energy
        ? html`
          <hr width="100%"/>

          <div class="date-picker">
            <p class="primary">${computeLabelCallback({ key: GlobalOptions, name: GlobalOptions.Date_Range })}</p>
            <energy-flow-card-ext-date-range-picker
              class="date-picker-control"
              .hass=${this.hass}
              .range=${getConfigValue(config, GlobalOptions.Date_Range)}
              .startDate=${startDate}
              .endDate=${endDate}
              @date-range-changed=${this._onDateRangeChanged}
            >
            </energy-flow-card-ext-date-range-picker>
          </div>

          <ha-form
            .hass=${this.hass}
            .data=${config}
            .schema=${dateRangeSchema()}
            .computeLabel=${computeLabelCallback}
            .computeHelper=${computeHelperCallback}
            @value-changed=${this._onValueChanged}
          ></ha-form>

          <hr width="100%"/>
        `
        : nothing}

        ${this._renderPageLinks()}
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _openPage(page: EditorPages): void {
    this._currentConfigPage = page;
  }

  //================================================================================================================================================================================//


  private _renderPageLinks = (): TemplateResult[] => {
    return CONFIG_PAGES.map(page => this._renderPageLink(page.page, page.icon, page.statusIcon(this._config!, this.style, this.hass)));
  };

  //================================================================================================================================================================================//

  private _renderPageLink = (page: EditorPages, icon: string, statusIcon: Status): TemplateResult => {
    if (!page) {
      return html``;
    }

    return html`
      <ha-control-button class="page-link" @click=${() => this._openPage(page)}>
        <ha-icon class="page-icon" .icon=${icon}></ha-icon>
        <div class="page-label">
          ${localize(`EditorPages.${page}`)}
          ${statusIcon !== Status.NotConfigured ? html`<ha-icon class="${STATUS_CLASSES[statusIcon]}" .icon=${STATUS_ICONS[statusIcon]}></ha-icon>` : nothing}
        </div>
        <ha-icon .icon=${"mdi:chevron-right"}></ha-icon>
      </ha-control-button>
    `;
  };

  //================================================================================================================================================================================//

  private _formatDate = (date: Date): string => {
    return formatDate(date, "yyyy-MM-dd");
  }

  //================================================================================================================================================================================//

  private _onGoBack(): void {
    this._currentConfigPage = undefined;
  }

  //================================================================================================================================================================================//

  private _onDateRangeChanged(ev: any): void {
    ev.stopPropagation();

    if (!this._config || !this.hass) {
      return;
    }

    let config: EnergyFlowCardExtConfig;

    if (ev.detail.range === DateRange.Custom) {
      config = {
        ...this._config,
        [GlobalOptions.Date_Range]: DateRange.Custom,
        [GlobalOptions.Date_Range_From]: this._formatDate(ev.detail.start as Date),
        [GlobalOptions.Date_Range_To]: this._formatDate(ev.detail.end as Date)
      };
    } else {
      config = {
        ...this._config,
        [GlobalOptions.Date_Range]: ev.detail.range,
        [GlobalOptions.Date_Range_From]: undefined,
        [GlobalOptions.Date_Range_To]: undefined
      };
    }

    fireEvent(this, "config-changed", { config: this._cleanupConfig(config) });
  }

  //================================================================================================================================================================================//

  private _onValueChanged(ev: any): void {
    ev.stopPropagation();

    if (!this._config || !this.hass || !ev.detail.value) {
      return;
    }

    let config = ev.detail.value;

    if (this._currentConfigPage) {
      config = {
        ...this._config,
        [this._currentConfigPage]: config
      };
    }

    fireEvent(this, "config-changed", { config: this._cleanupConfig(config) });
  }

  //================================================================================================================================================================================//

  private _cleanupConfig(config: EnergyFlowCardExtConfig): EnergyFlowCardExtConfig {
    config = removeConfigDefaults(config, this.hass);

    const threshold: string = getConfigValue(config, [EditorPages.Appearance, AppearanceOptions.Energy_Units, EnergyUnitsOptions.Prefix_Threshold]);

    if (threshold) {
      config[EditorPages.Appearance]![AppearanceOptions.Energy_Units]![EnergyUnitsOptions.Prefix_Threshold] = Number.parseInt(threshold);
    }

    return config;
  }

  //================================================================================================================================================================================//

  private _validateConfig(config: EnergyFlowCardExtConfig): {} {
    const errors: object = {};

    if (this._currentConfigPage) {
      const secondaryEntityId: string | undefined = getConfigValue(config, [this._currentConfigPage, NodeOptions.Secondary_Info, SecondaryInfoOptions.Entity_Id]);
      const node: Node<any> | undefined = createNode(this._config!, this.style, this.hass, this._currentConfigPage);

      switch (this._currentConfigPage) {
        case EditorPages.Battery:
        case EditorPages.Grid:
          const importEntityIds: string[] = getConfigValue(config, [this._currentConfigPage, NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]) || [];
          const exportEntityIds: string[] = getConfigValue(config, [this._currentConfigPage, NodeOptions.Export_Entities, EntitiesOptions.Entity_Ids]) || [];
          const entityIds: string[] = [...importEntityIds, ...exportEntityIds];
          validatePrimaryEntities(this.hass, NodeOptions.Import_Entities, entityIds, ELECTRIC_ENTITY_CLASSES, !!secondaryEntityId && !node!.hassConfigPresent, errors);
          break;

        case EditorPages.Gas:
          validatePrimaryEntities(this.hass, NodeOptions.Import_Entities, getConfigValue(config, [this._currentConfigPage, NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]), GAS_ENTITY_CLASSES, !!secondaryEntityId && !node!.hassConfigPresent, errors);
          break;

        case EditorPages.Solar:
          validatePrimaryEntities(this.hass, NodeOptions.Import_Entities, getConfigValue(config, [this._currentConfigPage, NodeOptions.Import_Entities, EntitiesOptions.Entity_Ids]), ELECTRIC_ENTITY_CLASSES, !!secondaryEntityId && !node!.hassConfigPresent, errors);
          break;
      }

      if (secondaryEntityId) {
        validateSecondaryEntity(this.hass, NodeOptions.Secondary_Info, secondaryEntityId, errors);
      }
    }

    return errors;
  }

  //================================================================================================================================================================================//

  static get styles(): CSSResultGroup {
    return [
      css`
        ha-form {
          width: 100%;
        }

        .card-config {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .page-link {
          width: 100%;
          min-height: 4rem;
          cursor: pointer;
        }

        .page-icon {
          margin-right: 1rem;
          --mdc-icon-size: 2rem;
        }

        .page-label {
          width: 100%;
          font-size: 1.2rem;
          text-align: left;
        }

        .page-valid {
          padding-left: 1rem;
          color: green;
        }

        .page-warning {
          padding-left: 1rem;
          color: orange;
        }

        .page-error {
          padding-left: 1rem;
          color: red;
        }

        .date-picker {
          cursor: default;
          display: inline-grid;
          margin-bottom: calc(24px - 1rem);
        }

        .primary {
          margin: 0;
        }

        .date-picker-control {
          background-color: var(--mdc-select-fill-color);
          min-height: 4rem;
          align-content: center;
        }
      `
    ];
  }
}
