import { v4 as uuidv4 } from 'uuid';
import { mdiArrowLeft, mdiArrowRight, mdiDelete, mdiDrag, mdiPlus } from "@mdi/js";
import { HomeAssistant, fireEvent } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit-element";
import { CARD_NAME } from "@/const";
import { DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions } from "@/config";
import { deviceSchema } from "../schema/device";
import { computeHelperCallback, computeLabelCallback, getStatusIcon, Status, STATUS_CLASSES, STATUS_ICONS, validatePrimaryEntities, validateSecondaryEntity } from "..";
import { repeat } from "lit/directives/repeat.js";
import { localize } from "@/localize/localize";
import { cleanupConfig, getDefaultDeviceConfig } from '@/config/config';

//================================================================================================================================================================================//

const DEVICES_EDITOR_ELEMENT_NAME = CARD_NAME + "-devices-editor";

@customElement(DEVICES_EDITOR_ELEMENT_NAME)
export class DevicesEditor extends LitElement {
  public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: EnergyFlowCardExtConfig;
  @state() private _devices?: DeviceConfig[];
  @state() protected _indexBeingEdited: number = -1;

  private _entityKeys = new WeakMap<DeviceConfig, string>();

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html`<div>no config</div>`;
    }

    this._devices = this.config.devices || [];

    if (this._indexBeingEdited !== -1) {
      return html`
        <div class="device-header">
          <ha-icon-button
            .label=${localize("editor.go_back")}
            .path=${mdiArrowLeft}
            class="remove-icon"
            @click=${() => (this._editDevice(-1))}
          ></ha-icon-button>
          <div class="device-navigation">
            <ha-icon-button
              .label=${localize("editor.previous")}
              .path=${mdiArrowLeft}
              .disabled=${this._indexBeingEdited == 0}
              class="navigation-icon"
              @click=${() => (this._editDevice(this._indexBeingEdited - 1))}
            ></ha-icon-button>
            <h4>${localize("editor.device")} ${this._indexBeingEdited + 1} / ${this._devices.length}</h4>
            <ha-icon-button
              .label=${localize("editor.next")}
              .path=${mdiArrowRight}
              .disabled=${this._indexBeingEdited == this._devices.length - 1}
              class="navigation-icon"
              @click=${() => (this._editDevice(this._indexBeingEdited + 1))}
            ></ha-icon-button>
            <ha-icon-button
              .label=${localize("editor.add_device")}
              .path=${mdiPlus}
              class="navigation-icon"
              @click=${this._addDevice}
            ></ha-icon-button>
            <ha-icon-button
              .label=${localize("editor.remove_device")}
              .path=${mdiDelete}
              class="navigation-icon"
              @click=${this._removeDevice}
            ></ha-icon-button>
          </div>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${this._devices[this._indexBeingEdited]}
          .schema=${deviceSchema(this.config, this._devices[this._indexBeingEdited])}
          .computeLabel=${computeLabelCallback}
          .computeHelper=${computeHelperCallback}
          .error=${this._validateConfig(this._devices[this._indexBeingEdited])}
          @value-changed=${this._valueChanged}
        ></ha-form>
      `;
    }

    return html`
      <ha-sortable handle-selector=".handle" @item-moved=${this._moveDevice}>
      <div>
        ${repeat(
      this._devices,
      deviceConf => this._getKey(deviceConf),
      (deviceConf, index) => {
        const statusIcon: Status = getStatusIcon(this.hass, deviceConf);

        return html`
          <div class="devices">
            <div class="handle">
              <ha-svg-icon .path=${mdiDrag}></ha-svg-icon>
            </div>
            <ha-control-button class="device-button" @click=${() => this._editDevice(index)}>
              <div class="device-label">
                <ha-icon class="device-icon" .icon=${deviceConf?.[DeviceOptions.Icon] || 'blank'}></ha-icon>
                ${deviceConf?.[DeviceOptions.Name]}
                ${statusIcon !== Status.Undefined ? html`<ha-icon class="${STATUS_CLASSES[statusIcon]}" .icon=${STATUS_ICONS[statusIcon]}></ha-icon>` : ``}
              </div>
              <ha-icon .icon=${"mdi:chevron-right"}></ha-icon>
            </ha-control-button>
            <ha-icon-button
              class="remove-icon"
              .label=${localize("editor.remove_device")}
              .path=${mdiDelete}
              .index=${index}
              @click=${this._removeDevice}
            ></ha-icon-button>
          </div>
        `}
    )}
      </div>
      </ha-sortable>
      <ha-control-button class="add-device" @click="${this._addDevice}">${localize("editor.add_device")}</ha-control-button>
    `;
  }

  //================================================================================================================================================================================//

  private _validateConfig(config: DeviceConfig): {} {
    const errors: object = {};
    const secondaryEntityId: string | undefined = config?.[EntitiesOptions.Secondary_Info]?.[EntityOptions.Entity_Id];

    validatePrimaryEntities(this.hass, EntitiesOptions.Entities, config?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids], !!secondaryEntityId, errors);

    if (secondaryEntityId) {
      validateSecondaryEntity(this.hass, EntitiesOptions.Secondary_Info, secondaryEntityId, errors);
    }

    return errors;
  }

  //================================================================================================================================================================================//

  private _getKey(config: DeviceConfig): string | undefined {
    if (!this._entityKeys.has(config)) {
      this._entityKeys.set(config, uuidv4());
    }

    return this._entityKeys.get(config)!;
  }

  //================================================================================================================================================================================//

  private async _addDevice(): Promise<void> {
    const newDevice: DeviceConfig = getDefaultDeviceConfig();
    const updatedDevices: DeviceConfig[] = this._devices!.concat(newDevice);
    this._editDevice(updatedDevices.length - 1);
    this._updateConfig(updatedDevices);
  }

  //================================================================================================================================================================================//

  private _moveDevice(ev: CustomEvent): void {
    if (ev.detail.oldIndex === ev.detail.newIndex) {
      return;
    }

    const updatedDevices = this._devices!.concat();
    updatedDevices.splice(ev.detail.newIndex!, 0, updatedDevices.splice(ev.detail.oldIndex!, 1)[0]);
    this._updateConfig(updatedDevices);
  }

  //================================================================================================================================================================================//

  private _removeDevice(ev: CustomEvent): void {
    const index = (ev.currentTarget as any).index;
    const updatedDevices = this._devices!.concat();
    updatedDevices.splice(index, 1);

    if (updatedDevices.length === 0) {
      this._editDevice(-1);
    } else if (updatedDevices.length <= this._indexBeingEdited) {
      this._editDevice(updatedDevices.length - 1);
    }

    this._updateConfig(updatedDevices);
  }

  //================================================================================================================================================================================//

  private _valueChanged(ev: any): void {
    if (!this.config || !this.hass) {
      return;
    }

    const value = ev.detail.value;
    const updatedDevices = this._devices!.concat();

    updatedDevices[this._indexBeingEdited] = value;
    this._updateConfig(updatedDevices);
  }

  //================================================================================================================================================================================//

  private _editDevice(index: number): void {
    this._indexBeingEdited = index;
  }

  //================================================================================================================================================================================//

  private _updateConfig(updatedDevices: DeviceConfig[]): void {
    const config: EnergyFlowCardExtConfig = { ...this.config, devices: updatedDevices.length === 0 ? undefined : updatedDevices };
    fireEvent(this, 'config-changed', { config: cleanupConfig(this.hass, config) });
  }

  //================================================================================================================================================================================//

  static get styles(): CSSResultGroup {
    return [
      css`
        ha-form {
          width: 100%;
        }

        .add-device,
        .device-button {
          width: 100%;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .device-icon {
          margin-right: 1rem;
        }

        .device-label {
          width: 100%;
          text-align: left;
        }

        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-inline: 0.2rem;
          margin-bottom: 1rem;
        }

        .device-navigation {
          display: inline-flex;
          align-items: center;
        }

        .devices {
          display: flex;
          align-items: center;
        }

        .devices .handle {
          padding-right: 0.5rem;
          cursor: move;
        }

        .devices .handle > * {
          pointer-events: none;
        }

        .remove-icon,
        .navigation-icon {
          --mdc-icon-button-size: 2rem;
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
