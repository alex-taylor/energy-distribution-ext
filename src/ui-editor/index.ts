import { localize } from "@/localize/localize";
import { HomeAssistant } from "custom-card-helpers";
import { EntitiesOptions, EntityOptions, isValidPrimaryEntity, isValidSecondaryEntity } from "@/config";

export function computeLabelCallback(schema: any): string {
  return localize(`editor.${schema?.name}`);
}

export function computeHelperCallback(schema: any): string {
  return localize(`editor.${schema?.name}#helptext`, "");
}

export enum Status {
  Undefined = 0,
  Valid,
  Warnings,
  Errors
};

export const STATUS_ICONS: string[] = ["", "mdi:check-circle", "mdi:alert", "mdi:alert-octagon"];
export const STATUS_CLASSES: string[] = ["", "page-valid", "page-warning", "page-error"];

export function getStatusIcon(hass: HomeAssistant, config: any, deviceClasses: string[], supportsPrimaries: boolean = true, requiresPrimaries: boolean = false): Status {
  let primaryEntityCount: number = 0;
  let secondaryEntityCount: number = 0;
  let validPrimaryEntityCount: number = 0;
  let invalidPrimaryEntityCount: number = 0;
  let invalidSecondaryEntityCount: number = 0;

  if (config?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids]) {
    config?.[EntitiesOptions.Entities]?.[EntityOptions.Entity_Ids].forEach(entityId => {
      primaryEntityCount++;

      if (isValidPrimaryEntity(hass, entityId, deviceClasses)) {
        validPrimaryEntityCount++;
      } else {
        invalidPrimaryEntityCount++;
      }
    });
  }

  if (config?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids]) {
    config?.[EntitiesOptions.Import_Entities]?.[EntityOptions.Entity_Ids].forEach(entityId => {
      primaryEntityCount++;

      if (isValidPrimaryEntity(hass, entityId, deviceClasses)) {
        validPrimaryEntityCount++;
      } else {
        invalidPrimaryEntityCount++;
      }
    });
  }

  if (config?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids]) {
    config?.[EntitiesOptions.Export_Entities]?.[EntityOptions.Entity_Ids].forEach(entityId => {
      primaryEntityCount++;

      if (isValidPrimaryEntity(hass, entityId, deviceClasses)) {
        validPrimaryEntityCount++;
      } else {
        invalidPrimaryEntityCount++;
      }
    });
  }

  if (config?.[EntitiesOptions.Secondary_Info]?.[EntityOptions.Entity_Id]) {
    secondaryEntityCount++;

    if (!isValidSecondaryEntity(hass, config?.[EntitiesOptions.Secondary_Info]?.[EntityOptions.Entity_Id])) {
      invalidSecondaryEntityCount++;
    }
  }

  if (primaryEntityCount === 0 && requiresPrimaries) {
    return Status.Errors;
  }

  if (primaryEntityCount === 0 && secondaryEntityCount === 0) {
    return Status.Undefined;
  }

  if ((primaryEntityCount > 0 || secondaryEntityCount > 0) && validPrimaryEntityCount === 0 && supportsPrimaries) {
    return Status.Errors;
  }

  if (invalidPrimaryEntityCount > 0 || invalidSecondaryEntityCount > 0) {
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
