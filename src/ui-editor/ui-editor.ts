import { LitElement, css, html, nothing, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import { assert } from 'superstruct';
import { EditorPages, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions, HomeConfig } from '@/config';
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
import { CARD_NAME } from '@/const';
import { cardConfigStruct } from '@/config/validation';
import { computeHelperCallback, computeLabelCallback, getStatusIcon, Status, STATUS_CLASSES, STATUS_ICONS, validatePrimaryEntities, validateSecondaryEntity } from '.';
import { getDefaultLowCarbonConfig, cleanupConfig, getDefaultAppearanceConfig, getDefaultGridConfig, getDefaultGasConfig, getDefaultSolarConfig, getDefaultBatteryConfig, getDefaultHomeConfig, getCo2SignalEntity } from '@/config/config';

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
      statusIcon: () => Status.Undefined
    },
    {
      page: EditorPages.Grid,
      icon: "mdi:transmission-tower",
      schema: gridSchema,
      createConfig: getDefaultGridConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, config?.[EditorPages.Grid])
    },
    {
      page: EditorPages.Gas,
      icon: "mdi:fire",
      schema: gasSchema,
      createConfig: getDefaultGasConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, config?.[EditorPages.Gas])
    },
    {
      page: EditorPages.Solar,
      icon: "mdi:solar-power",
      schema: solarSchema,
      createConfig: getDefaultSolarConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, config?.[EditorPages.Solar])
    },
    {
      page: EditorPages.Battery,
      icon: "mdi:battery-high",
      schema: batterySchema,
      createConfig: getDefaultBatteryConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => getStatusIcon(hass, config?.[EditorPages.Battery])
    },
    {
      page: EditorPages.Low_Carbon,
      icon: "mdi:leaf",
      schema: lowCarbonSchema,
      createConfig: getDefaultLowCarbonConfig,
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => {
        const status = getStatusIcon(hass, config?.[EditorPages.Low_Carbon], false);

        if (status !== Status.Undefined) {
          return status;
        }

        return getCo2SignalEntity(hass) !== undefined ? Status.Valid : Status.Undefined;
      }
    },
    {
      page: EditorPages.Home,
      icon: "mdi:home",
      schema: homeSchema,
      createConfig: getDefaultHomeConfig,
      statusIcon: (config: HomeConfig, hass: HomeAssistant): Status => getStatusIcon(hass, config?.[EditorPages.Home], false)
    },
    {
      page: EditorPages.Devices,
      icon: "mdi:devices",
      createConfig: () => { },
      statusIcon: (config: EnergyFlowCardExtConfig, hass: HomeAssistant): Status => config?.[EditorPages.Devices]?.map(device => getStatusIcon(hass, device)).reduce((previous, current) => current > previous ? current : previous) || Status.Undefined
    }
  ];

//================================================================================================================================================================================//

@customElement(EDITOR_ELEMENT_NAME)
export class EnergyFlowCardExtEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: EnergyFlowCardExtConfig;
  @state() private _currentConfigPage: EditorPages | null = null;

  public async setConfig(config: EnergyFlowCardExtConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const config: EnergyFlowCardExtConfig = this._config;

    if (this._currentConfigPage) {
      const currentPage: string = this._currentConfigPage;
      const schema = CONFIG_PAGES.find(page => page.page === currentPage)?.schema;
      const icon: string | undefined = CONFIG_PAGES.find((page) => page.page === currentPage)?.icon;

      if (!config[currentPage]) {
        config[currentPage] = CONFIG_PAGES.find(page => page.page === currentPage)?.createConfig(this.hass);
      }

      const configForPage: any = config[currentPage];

      return html`
        <energy-flow-card-ext-page-header @go-back=${this._goBack} icon="${icon}" label=${localize(`editor.${currentPage}`)}></energy-flow-card-ext-page-header>
        ${this._currentConfigPage === EditorPages.Devices
          ? html`
            <energy-flow-card-ext-devices-editor
              .hass=${this.hass}
              .config=${this._config}
              @config-changed=${this._valueChanged}
            ></energy-flow-card-ext-devices-editor>
          `
          : html`
            <ha-form
              .hass=${this.hass}
              .data=${configForPage}
              .schema=${schema(config, configForPage)}
              .computeLabel=${computeLabelCallback}
              .computeHelper=${computeHelperCallback}
              .error=${this._validateConfig(config)}
              @value-changed=${this._valueChanged}
            ></ha-form>
          `
        }
      `;
    }

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${config}
          .schema=${generalConfigSchema(config)}
          .computeLabel=${computeLabelCallback}
          .computeHelper=${computeHelperCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
        ${this._renderPageLinks()}
      </div>
    `;
  }

  //================================================================================================================================================================================//

  private _openPage(page: EditorPages): void {
    this._currentConfigPage = page;
  }

  //================================================================================================================================================================================//

  private _goBack(): void {
    this._currentConfigPage = null;
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
          ${localize(`editor.${page}`)}
          ${statusIcon !== Status.Undefined ? html`<ha-icon class="${STATUS_CLASSES[statusIcon]}" .icon=${STATUS_ICONS[statusIcon]}></ha-icon>` : ``}
        </div>
        <ha-icon .icon=${"mdi:chevron-right"}></ha-icon>
      </ha-control-button>
    `;
  };

  //================================================================================================================================================================================//

  private _valueChanged(ev: any): void {
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

    fireEvent(this, 'config-changed', { config: cleanupConfig(this.hass, config) });
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
          validatePrimaryEntities(this.hass, EntitiesOptions.Import_Entities, entityIds, !!secondaryEntityId, errors);
          break;

        case EditorPages.Gas:
        case EditorPages.Solar:
          validatePrimaryEntities(this.hass, EntitiesOptions.Entities, config?.[this._currentConfigPage]?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids], !!secondaryEntityId, errors);
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
