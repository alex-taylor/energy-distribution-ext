import { LitElement, css, html, nothing, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import { assert } from 'superstruct';
import { EditorPages, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions, GlobalOptions, HomeConfig } from '@/config';
import { appearanceSchema, generalConfigSchema } from './schema';
import { localize } from '@/localize/localize';
import { gridSchema } from './schema/grid';
import { solarSchema } from './schema/solar';
import { batterySchema } from './schema/battery';
import { lowCarbonSchema } from './schema/low-carbon';
import { homeSchema } from './schema/home';
import { gasSchema } from './schema/gas';
import "./components/page-header";
import "./components/devices-editor";
import { CARD_NAME, ELECTRIC_ENTITY_CLASSES, GAS_ENTITY_CLASSES } from '@/const';
import { cardConfigStruct } from '@/config/validation';
import { computeHelperCallback, computeLabelCallback, getStatusIcon, Status, STATUS_CLASSES, STATUS_ICONS, validatePrimaryEntities, validateSecondaryEntity } from '.';
import { getDefaultLowCarbonConfig, cleanupConfig, getDefaultAppearanceConfig, getDefaultGridConfig, getDefaultGasConfig, getDefaultSolarConfig, getDefaultBatteryConfig, getDefaultHomeConfig, getCo2SignalEntity, getConfigValue } from '@/config/config';
import { GasState } from '@/states/gas';
import { getEnergyDataCollection } from '@/energy';
import { GridState } from '@/states/grid';
import { SolarState } from '@/states/solar';
import { BatteryState } from '@/states/battery';
import { LowCarbonState } from '@/states/low-carbon';
import { HomeState } from '@/states/home';
import { DeviceState } from '@/states/device';
import { endOfToday, startOfToday, formatDate } from 'date-fns';

//================================================================================================================================================================================//

export const EDITOR_ELEMENT_NAME = CARD_NAME + "-editor";

const CONFIG_PAGES: {
  page: EditorPages;
  icon: string;
  schema?;
  createConfig?;
  statusIcon: (config: any, hass: HomeAssistant) => Status;
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
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, new GridState(hass, getConfigValue(config, EditorPages.Grid), getEnergyDataCollection(hass)?.prefs?.energy_sources || []), ELECTRIC_ENTITY_CLASSES)
    },
    {
      page: EditorPages.Gas,
      icon: "mdi:fire",
      schema: gasSchema,
      createConfig: getDefaultGasConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, new GasState(hass, getConfigValue(config, EditorPages.Gas), getEnergyDataCollection(hass)?.prefs?.energy_sources || []), GAS_ENTITY_CLASSES)
    },
    {
      page: EditorPages.Solar,
      icon: "mdi:solar-power",
      schema: solarSchema,
      createConfig: getDefaultSolarConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, new SolarState(hass, getConfigValue(config, EditorPages.Solar), getEnergyDataCollection(hass)?.prefs?.energy_sources || []), ELECTRIC_ENTITY_CLASSES)
    },
    {
      page: EditorPages.Battery,
      icon: "mdi:battery-high",
      schema: batterySchema,
      createConfig: getDefaultBatteryConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, new BatteryState(hass, getConfigValue(config, EditorPages.Battery), getEnergyDataCollection(hass)?.prefs?.energy_sources || []), ELECTRIC_ENTITY_CLASSES)
    },
    {
      page: EditorPages.Low_Carbon,
      icon: "mdi:leaf",
      schema: lowCarbonSchema,
      createConfig: getDefaultLowCarbonConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => {
        const status = getStatusIcon(hass, new LowCarbonState(hass, getConfigValue(config, EditorPages.Low_Carbon)), ELECTRIC_ENTITY_CLASSES, false);

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
      statusIcon: (config: HomeConfig, hass: HomeAssistant): Status => getStatusIcon(hass, new HomeState(hass, getConfigValue(config, EditorPages.Home)), ELECTRIC_ENTITY_CLASSES, false)
    },
    {
      page: EditorPages.Devices,
      icon: "mdi:devices",
      createConfig: () => { },
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status =>
        getConfigValue(config, EditorPages.Devices)?.map(device => getStatusIcon(hass, new DeviceState(hass, device), ELECTRIC_ENTITY_CLASSES)).reduce((previous, current) => current > previous ? current : previous) || Status.NotConfigured
    }
  ];

//================================================================================================================================================================================//

@customElement(EDITOR_ELEMENT_NAME)
export class EnergyFlowCardExtEditor extends LitElement implements LovelaceCardEditor {
  public hass!: HomeAssistant;

  @state() private _config?: EnergyFlowCardExtConfig;
  @state() private _currentConfigPage?: EditorPages;

  public async setConfig(config: EnergyFlowCardExtConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = cleanupConfig(config);
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const config: EnergyFlowCardExtConfig = this._config;
    const currentConfigPage: EditorPages | undefined = this._currentConfigPage;

    if (currentConfigPage) {
      const schema = CONFIG_PAGES.find(page => page.page === currentConfigPage)?.schema;
      const icon: string | undefined = CONFIG_PAGES.find((page) => page.page === currentConfigPage)?.icon;

      if (!config[currentConfigPage]) {
        config[currentConfigPage] = CONFIG_PAGES.find(page => page.page === currentConfigPage)?.createConfig();
      }

      const configForPage: any = config[currentConfigPage];

      return html`
        <energy-flow-card-ext-page-header @go-back=${this._goBack} icon="${icon}" label=${localize(`EditorPages.${currentConfigPage}`)}></energy-flow-card-ext-page-header>
        ${currentConfigPage === EditorPages.Devices
          ? html`
            <energy-flow-card-ext-devices-editor
              .hass=${this.hass}
              .config=${this._config}
              @value-changed=${this._valueChanged}
            ></energy-flow-card-ext-devices-editor>
          `
          : html`
            <ha-form
              .hass=${this.hass}
              .data=${configForPage}
              .schema=${schema(config)}
              .computeLabel=${computeLabelCallback}
              .computeHelper=${computeHelperCallback}
              .error=${this._validateConfig(config)}
              @value-changed=${this._valueChanged}
            ></ha-form>
          `
        }
      `;
    }

    // TODO: work out the actual values based on the setting of Date_Range
    const startDateValue: string = getConfigValue(config, [GlobalOptions.Date_Range_From]);
    const endDateValue: string = getConfigValue(config, [GlobalOptions.Date_Range_To]);

    const startDate: Date = startDateValue ? new Date(startDateValue) : startOfToday();
    const endDate: Date = endDateValue ? new Date(endDateValue) : endOfToday();

    const ranges: {} = {
      "today": [startOfToday(), endOfToday()]
    };

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${config}
          .schema=${generalConfigSchema()}
          .computeLabel=${computeLabelCallback}
          .computeHelper=${computeHelperCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <div style="display: flex;">
          <span style="font-size: var(--ha-font-size-xl)">
            ${formatDate(startDate, "d MMM")} - ${formatDate(endDate, "d MMM")}
          </span>

        <ha-date-range-picker
          .hass=${this.hass}
          .startDate=${startDate}
          .endDate=${endDate}
          .ranges=${ranges}
          minimal
          @preset-selected=${this.dateRangePreset}
          @value-changed=${this.dateRangeChanged}
        ></ha-date-range-picker>

        </div>

        ${this._renderPageLinks()}
      </div>
    `;
  }

  private dateRangePreset(ev: any) {
    console.log(ev.detail.index);
  }

  //================================================================================================================================================================================//

  private _openPage(page: EditorPages): void {
    this._currentConfigPage = page;
  }

  //================================================================================================================================================================================//

  private _goBack(): void {
    this._currentConfigPage = undefined;
  }

  //================================================================================================================================================================================//

  private _renderPageLinks = (): TemplateResult[] => {
    return CONFIG_PAGES.map(page => this._renderPageLink(page.page, page.icon, page.statusIcon(this._config, this.hass)));
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
          ${statusIcon !== Status.NotConfigured ? html`<ha-icon class="${STATUS_CLASSES[statusIcon]}" .icon=${STATUS_ICONS[statusIcon]}></ha-icon>` : ``}
        </div>
        <ha-icon .icon=${"mdi:chevron-right"}></ha-icon>
      </ha-control-button>
    `;
  };

  //================================================================================================================================================================================//

  private _valueChanged(ev: any): void {
    ev.stopPropagation();

    if (!this._config || !this.hass) {
      return;
    }

    let config = ev.detail.value || "";

    if (this._currentConfigPage) {
      config = {
        ...this._config,
        [this._currentConfigPage]: config
      };
    }

    fireEvent(this, 'config-changed', { config: cleanupConfig(config) });
  }

  //================================================================================================================================================================================//

  private dateRangeChanged(ev: any): void {
    ev.stopPropagation();

    if (!this._config || !this.hass) {
      return;
    }

    const config: EnergyFlowCardExtConfig = {
      ...this._config,
      [GlobalOptions.Date_Range_From]: this._formatDate(ev.detail.value.startDate as Date),
      [GlobalOptions.Date_Range_To]: this._formatDate(ev.detail.value.endDate as Date)
    };

    fireEvent(this, 'config-changed', { config: cleanupConfig(config) });
  }

  //================================================================================================================================================================================//

  private _formatDate = (date: Date): string => {
    return formatDate(date, "yyyy-MM-dd");
  }

  //================================================================================================================================================================================//

  private _validateConfig(config: EnergyFlowCardExtConfig): {} {
    const errors: object = {};

    if (this._currentConfigPage) {
      const secondaryEntityId: string | undefined = config?.[this._currentConfigPage]?.[EntitiesOptions.Secondary_Info]?.[EntityOptions.Entity_Id];

      switch (this._currentConfigPage) {
        case EditorPages.Battery:
        case EditorPages.Grid:
          const importEntityIds: string[] = config?.[this._currentConfigPage]?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids] || [];
          const exportEntityIds: string[] = config?.[this._currentConfigPage]?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids] || [];
          const entityIds: string[] = [...importEntityIds, ...exportEntityIds];
          validatePrimaryEntities(this.hass, EntitiesOptions.Import_Entities, entityIds, ELECTRIC_ENTITY_CLASSES, !!secondaryEntityId, errors);
          break;

        case EditorPages.Gas:
          validatePrimaryEntities(this.hass, EntitiesOptions.Entities, config?.[this._currentConfigPage]?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids], GAS_ENTITY_CLASSES, !!secondaryEntityId, errors);
          break;

        case EditorPages.Solar:
          validatePrimaryEntities(this.hass, EntitiesOptions.Entities, config?.[this._currentConfigPage]?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids], ELECTRIC_ENTITY_CLASSES, !!secondaryEntityId, errors);
          break;
      }

      if (secondaryEntityId) {
        validateSecondaryEntity(this.hass, EntitiesOptions.Secondary_Info, secondaryEntityId, errors);
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
      `
    ];
  }
}
