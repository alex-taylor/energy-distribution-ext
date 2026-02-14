import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { isValidPrimaryEntity, isValidSecondaryEntity } from "@/config";
import { Node } from "@/nodes/node";
import { HELPTEXT_SUFFIX } from "@/const";
import memoizeOne from "memoize-one";
import { DisplayMode } from "@/enums";

//================================================================================================================================================================================//

export const computeLabelCallback = memoizeOne((schema: any): string => {
  if (!schema) {
    return "";
  }

  const name: string = schema.label || schema.name;

  if (schema.key && schema.key.name) {
    if (schema.page) {
      return localize(`${schema.key.name}.${name}.${schema.page}`);
    }

    return localize(`${schema.key.name}.${name}`);
  }

  return localize(`editor.${name}`);
});

export const computeHelperCallback = memoizeOne((schema: any): string => {
  if (!schema) {
    return "";
  }

  if (schema.key && schema.key.name) {
    return localize(`${schema.key.name}.${schema.name}${HELPTEXT_SUFFIX}`, "");
  }

  return localize(`editor.${schema.name}${HELPTEXT_SUFFIX}`, "");
});

export enum Status {
  NotConfigured = 0,
  Valid,
  Warnings,
  Errors
};

export const STATUS_ICONS: string[] = ["", "mdi:check-circle", "mdi:alert", "mdi:alert-octagon"];
export const STATUS_CLASSES: string[] = ["", "page-valid", "page-warning", "page-error"];

//================================================================================================================================================================================//

export function getStatusIcon(hass: HomeAssistant, mode: DisplayMode, node: Node<any>, deviceClasses: string[], supportsPrimaries: boolean, requiresPrimaries: boolean = false): Status {
  let primaryEntityCount: number = 0;
  let secondaryEntity: boolean = false;
  let validPrimaryEntityCount: number = 0;
  let invalidPrimaryEntityCount: number = 0;
  let invalidSecondaryEntity: boolean = false;

  if (node.configEntities.length !== 0) {
    node.configEntities.forEach(entityId => {
      primaryEntityCount++;

      if (isValidPrimaryEntity(hass, mode, entityId, deviceClasses)) {
        validPrimaryEntityCount++;
      } else {
        invalidPrimaryEntityCount++;
      }
    });
  }

  if (node.secondary.configEntity) {
    secondaryEntity = true;

    if (!isValidSecondaryEntity(hass, mode, node.secondary.configEntity)) {
      invalidSecondaryEntity = true;
    }
  }

  if (!node.hassConfigPresent) {
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

//================================================================================================================================================================================//

export function validatePrimaryEntities(hass: HomeAssistant, mode: DisplayMode, label: string, entityIds: string[] = [], deviceClasses: string[], requirePrimary: boolean, errors: object): void {
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
      } else if (!isValidPrimaryEntity(hass, mode, entityId, deviceClasses)) {
        error += `'${hass.states[entityId]?.attributes?.friendly_name || entityId}' ${localize("editor.invalid_primary_entity")}\n`;
      }
    });
  }

  if (error) {
    errors[label] = error;
  }
}

//================================================================================================================================================================================//

export function validateSecondaryEntity(hass: HomeAssistant, mode: DisplayMode, label: string, entityId: string, errors: object): void {
  delete errors[label];

  if (entityId === undefined) {
    return;
  }

  if (!entityId || entityId === "") {
    errors[label] = localize("editor.missing_entity");
  } else if (!isValidSecondaryEntity(hass, mode, entityId)) {
    errors[label] = `'${hass.states[entityId]?.attributes?.friendly_name || entityId}' ${localize("editor.invalid_secondary_entity")}`;
  }
}

//================================================================================================================================================================================//
