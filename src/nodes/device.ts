import { DeviceConfig, DeviceOptions, ColourOptions, EditorPages, EnergyDistributionExtConfig } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { Node } from "./node";
import { DEFAULT_DEVICE_CONFIG, getConfigValue } from "@/config/config";
import { CssClass, DisplayMode, ELECTRIC_ENTITY_CLASSES, EnergyDirection, EnergyType, GAS_ENTITY_CLASSES, SIUnitPrefixes, VolumeUnits } from "@/enums";
import { States } from ".";
import { Colours } from "./colours";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { POWER_UNITS } from "@/const";

//================================================================================================================================================================================//

export class DeviceNode extends Node<DeviceConfig> {
  public readonly colours: Colours;
  public readonly type: EnergyType;
  public readonly direction: EnergyDirection;
  public readonly subtractConsumption: boolean;
  public exportIcon: string = "";
  public importIcon: string = "";

  protected readonly defaultName: string;
  protected readonly defaultIcon: string;

  private readonly _index: number;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration, index: number) {
    super(
      hass,
      cardConfig,
      style,
      EditorPages.Devices,
      `${CssClass.Device}-${index}` as CssClass,
      index,
      getConfigValue([(getConfigValue(cardConfig, EditorPages.Devices) as DeviceConfig[])[index], DEFAULT_DEVICE_CONFIG], DeviceOptions.Energy_Type) === EnergyType.Gas ? GAS_ENTITY_CLASSES : ELECTRIC_ENTITY_CLASSES
    );

    this._index = index;

    this.defaultName = getConfigValue(this.nodeConfigs, DeviceOptions.Name);
    this.defaultIcon = getConfigValue(this.nodeConfigs, DeviceOptions.Icon);

    this.type = getConfigValue(this.nodeConfigs, DeviceOptions.Energy_Type);
    this.direction = getConfigValue(this.nodeConfigs, DeviceOptions.Energy_Direction);
    this.subtractConsumption = getConfigValue(this.nodeConfigs, DeviceOptions.Subtract_From_Home);

    this.colours = new Colours(
      this.coloursConfigs,
      this.direction,
      getConfigValue(this.coloursConfigs, ColourOptions.Flow_Import_Colour),
      getConfigValue(this.coloursConfigs, ColourOptions.Flow_Export_Colour)
    );

    style.setProperty(`--flow-import-device-${index}-color`, this.colours.importFlow);
    style.setProperty(`--flow-export-device-${index}-color`, this.colours.exportFlow);
  }

  //================================================================================================================================================================================//

  public readonly render = (target: LitElement, _circleSize: number, states?: States, overrideElectricPrefix?: SIUnitPrefixes, overrideGasPrefix?: SIUnitPrefixes): TemplateResult => {
    const index: number = this._index;
    let importValue: number | undefined | null;
    let exportValue: number | undefined | null;
    let units: string = "";

    if (states) {
      if (this.mode === DisplayMode.Energy) {
        if (this.type === EnergyType.Gas) {
          if (this.gasUnits !== VolumeUnits.Same_As_Electric) {
            importValue = this.firstImportEntity ? states.devicesGasVolume[index]?.import : null;
            exportValue = this.firstExportEntity ? states.devicesGasVolume[index]?.export : null;
            units = this.gasUnits;
          } else {
            importValue = this.firstImportEntity ? states.devicesGas[index]?.import : null;
            exportValue = this.firstExportEntity ? states.devicesGas[index]?.export : null;
            units = this.electricUnits;
          }

          this.setCssVariables(this.style, states.devicesGas[index]);
        } else {
          importValue = this.firstImportEntity ? states.devicesElectric[index]?.import : null;
          exportValue = this.firstExportEntity ? states.devicesElectric[index]?.export : null;
          units = this.electricUnits;

          this.setCssVariables(this.style, states.devicesElectric[index]);
        }
      } else {
        if (this.type === EnergyType.Gas) {
          importValue = this.firstImportEntity ? states.devicesGas[index]?.import : null;
          exportValue = this.firstExportEntity ? states.devicesGas[index]?.export : null;
          this.setCssVariables(this.style, states.devicesGas[index]);
        } else {
          importValue = this.firstImportEntity ? states.devicesElectric[index]?.import : null;
          exportValue = this.firstExportEntity ? states.devicesElectric[index]?.export : null;
          this.setCssVariables(this.style, states.devicesElectric[index]);
        }

        units = POWER_UNITS;
      }
    } else {
      importValue = null;
      exportValue = null;
    }

    const inactiveCss: CssClass = !states || (!importValue && !exportValue) ? this.inactiveFlowsCss : CssClass.None;
    const importCss: string = "import-" + this.cssClass;
    const exportCss: string = "export-" + this.cssClass;
    const prefix: SIUnitPrefixes | undefined = this.type === EnergyType.Electric ? overrideElectricPrefix : overrideGasPrefix;

    // noinspection HtmlDeprecatedAttribute
    return html`
      <style type="text/css" scoped>
        .device-${index} .circle {
          color: var(--circle-device-${index}-color);
        }
        .device-${index} ha-icon {
          color: var(--icon-device-${index}-color);
        }
        .device-${index}.secondary-info {
          color: var(--secondary-device-${index}-color);
        }
        .export-device-${index}.value:not(.idle) {
          color: var(--exportValue-device-${index}-color);
        }
        .import-device-${index}.value:not(.idle) {
          color: var(--importValue-device-${index}-color);
        }
        circle.import-device-${index} {
          fill: var(--flow-import-device-${index}-color);
          stroke: var(--flow-import-device-${index}-color);
        }
        circle.export-device-${index} {
          fill: var(--flow-export-device-${index}-color);
          stroke: var(--flow-export-device-${index}-color);
        }
        path.export-device-${index} {
          stroke: var(--flow-export-device-${index}-color);
        }
        path.import-device-${index} {
          stroke: var(--flow-import-device-${index}-color);
        }
        .device-${index}-home-anim {
          animation-duration: var(--device-${index}-home-anim-duration);
          animation-name: device${index}HomeAnim;
          animation-iteration-count: infinite;
        }
        @keyframes device${index}HomeAnim {
          0% { stroke: var(--flow-export-device-${index}-color); }
          50% { stroke: var(--flow-import-device-${index}-color); }
          100% { stroke: var(--flow-export-device-${index}-color); }
        }
      </style>

      <div class="circle ${inactiveCss}">
        ${this.renderSecondarySpan(target, this.secondary, states?.devicesSecondary[index], this.cssClass)}
        <ha-icon class="entity-icon" .icon=${this.icon}></ha-icon>
        ${this.direction !== EnergyDirection.Producer_Only ? this.renderEnergyStateSpan(target, exportCss, units, this.firstExportEntity, (this.mode !== DisplayMode.Power || exportValue !== 0) && this.direction === EnergyDirection.Both ? this.exportIcon : undefined, exportValue, prefix) : nothing}
        ${this.direction !== EnergyDirection.Consumer_Only ? this.renderEnergyStateSpan(target, importCss, units, this.firstImportEntity, (this.mode !== DisplayMode.Power || importValue !== 0) && this.direction === EnergyDirection.Both ? this.importIcon : undefined, importValue, prefix) : nothing}
      </div>
    `;
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//
