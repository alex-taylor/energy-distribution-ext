import { fireEvent, HomeAssistant } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { endOfToday, startOfToday } from "date-fns";
import { DateRange } from "@/enums";
import { renderDateRange, getRangePresetName } from "@/ui-helpers/date-fns";
import { customElement, property } from "lit/decorators.js";
import { name } from '../../../package.json';

//================================================================================================================================================================================//

const DATE_RANGE_PICKER_ELEMENT_NAME: string = `${name}-date-range-picker`;

const PRESET_KEYS: DateRange[] = Object.values(DateRange).filter(range => range !== DateRange.Custom);

//================================================================================================================================================================================//

@customElement(DATE_RANGE_PICKER_ELEMENT_NAME)
export class DateRangePicker extends LitElement {
  public hass!: HomeAssistant;
  public range: DateRange = DateRange.Custom;
  public startDate?: Date;
  public endDate?: Date;

  private _lastSelectedPreset: DateRange = DateRange.Custom;
  private _ranges: object = {};
  @property() private _label: string = "";

  //================================================================================================================================================================================//

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    PRESET_KEYS.forEach(key => {
      this._ranges[getRangePresetName(this.hass, key)] = [startOfToday(), endOfToday()];
    });

    this._label = this._generateLabel(this.range);
  }

  //================================================================================================================================================================================//

  protected render(): TemplateResult {
    return html`
        <div class="control">
          <ha-date-range-picker
            .hass=${this.hass}
            .openingDirection=${"right"}
            .startDate=${this.startDate}
            .endDate=${this.endDate}
            .ranges=${this._ranges}
            minimal
            @preset-selected=${this._onPresetSelected}
            @value-changed=${this._onDateRangeChanged}
          ></ha-date-range-picker>
          <span class="label">${this._label}</span>
        </div>
    `;
  }

  //================================================================================================================================================================================//

  private _generateLabel(range: DateRange): string {
    if (range === DateRange.Custom) {
      return renderDateRange(this.hass.language, this.startDate!, this.endDate!);
    }

    return getRangePresetName(this.hass, range);
  }

  //================================================================================================================================================================================//

  private _onPresetSelected(ev: any): void {
    this._lastSelectedPreset = PRESET_KEYS[ev.detail.index];
  }

  //================================================================================================================================================================================//

  private _onDateRangeChanged(ev: any): void {
    ev.stopPropagation();

    this.startDate = ev.detail.value.startDate;
    this.endDate = ev.detail.value.endDate;
    this._label = this._generateLabel(this._lastSelectedPreset);

    if (this._lastSelectedPreset === DateRange.Custom) {
      fireEvent(this, "date-range-changed", { range: DateRange.Custom, start: this.startDate, end: this.endDate });
    } else {
      fireEvent(this, "date-range-changed", { range: this._lastSelectedPreset, start: undefined, end: undefined });
    }

    this._lastSelectedPreset = DateRange.Custom;
  }

  //================================================================================================================================================================================//

  static get styles(): CSSResultGroup {
    // noinspection CssUnresolvedCustomProperty,CssUnusedSymbol
    return [
      css`
        .control {
          width: 100%;
          display: inline-flex;
          align-items: anchor-center;
        }

        .label {
          font-size: var(--ha-font-size-l)
        }
      `
    ];
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface HASSDomEvents {
    "date-range-changed": {
      range: DateRange;
      start?: Date;
      end?: Date;
    };
  }
}

//================================================================================================================================================================================//
