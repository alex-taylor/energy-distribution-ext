import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { isValidPrimaryEntity, isValidSecondaryEntity } from "@/config";
import { ValueState } from "@/states/state";
import { HELPTEXT_SUFFIX } from "@/const";

export function computeLabelCallback(schema: any): string {
  if (!schema) {
    return "";
  }

  if (schema.key && schema.key.name) {
    return localize(`${schema.key.name}.${schema.name}`);
  }

  return localize(`editor.${schema.name}`);
}

export function computeHelperCallback(schema: any): string {
  if (!schema) {
    return "";
  }

  if (schema.key && schema.key.name) {
    return localize(`${schema.key.name}.${schema.name}${HELPTEXT_SUFFIX}`, "");
  }

  return localize(`editor.${schema.name}${HELPTEXT_SUFFIX}`, "");
}

export enum Status {
  NotConfigured = 0,
  Valid,
  Warnings,
  Errors
};

export const STATUS_ICONS: string[] = ["", "mdi:check-circle", "mdi:alert", "mdi:alert-octagon"];
export const STATUS_CLASSES: string[] = ["", "page-valid", "page-warning", "page-error"];

export function getStatusIcon(hass: HomeAssistant, state: ValueState, deviceClasses: string[], supportsPrimaries: boolean = true, requiresPrimaries: boolean = false): Status {
  let primaryEntityCount: number = 0;
  let secondaryEntity: boolean = false;
  let validPrimaryEntityCount: number = 0;
  let invalidPrimaryEntityCount: number = 0;
  let invalidSecondaryEntity: boolean = false;

  if (state.rawEntities.length !== 0) {
    state.rawEntities.forEach(entityId => {
      primaryEntityCount++;

      if (isValidPrimaryEntity(hass, entityId, deviceClasses)) {
        validPrimaryEntityCount++;
      } else {
        invalidPrimaryEntityCount++;
      }
    });
  }

  if (state.secondary.rawEntities.length !== 0) {
    secondaryEntity = true;

    if (!isValidSecondaryEntity(hass, state.secondary.rawEntities[0])) {
      invalidSecondaryEntity = true;
    }
  }

  if (!state.hassConfigPresent) {
    if (primaryEntityCount === 0 && requiresPrimaries) {
      return Status.Errors;
    }

    if (primaryEntityCount === 0 && !secondaryEntity) {
      return Status.NotConfigured;
    }

    if ((primaryEntityCount > 0 || secondaryEntity) && validPrimaryEntityCount === 0 && supportsPrimaries) {
      return Status.Errors;
    }
  }

  if (invalidPrimaryEntityCount > 0 || invalidSecondaryEntity) {
    return Status.Warnings;
  }

  return Status.Valid;
}

export function validatePrimaryEntities(hass: HomeAssistant, label: string, entityIds: string[] = [], deviceClasses: string[], requirePrimary: boolean, errors: object): void {
  delete errors[label];

  let error: string = "";

  if (entityIds.length === 0) {
    if (requirePrimary) {
      error = localize("editor.missing_entity");
    }
  } else {
    entityIds.forEach(entityId => {
      if (!entityId || entityId === "") {
        error += localize("editor.missing_entity") + "\n";
      } else if (!isValidPrimaryEntity(hass, entityId, deviceClasses)) {
        error += "'" + (hass.states[entityId]?.attributes?.friendly_name || entityId) + "' " + localize("editor.invalid_primary_entity") + "\n";
      }
    });
  }

  if (error) {
    errors[label] = error;
  }
}

export function validateSecondaryEntity(hass: HomeAssistant, label: string, entityId: string, errors: object): void {
  delete errors[label];

  if (entityId === undefined) {
    return;
  }

  if (!entityId || entityId === "") {
    errors[label] = localize("editor.missing_entity");
  } else if (!isValidSecondaryEntity(hass, entityId)) {
    errors[label] = "'" + (hass.states[entityId]?.attributes?.friendly_name || entityId) + "' " + localize("editor.invalid_secondary_entity");
  }
}
