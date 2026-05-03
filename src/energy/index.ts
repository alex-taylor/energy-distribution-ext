import { HomeAssistant } from 'custom-card-helpers';
import { EnergyCollection, EnergyPreferences } from '@/hass';
import { SIUnitPrefixes } from "@/enums";
import { Decimal } from "decimal.js";
import { EnergyUnitsConfig, EnergyUnitsOptions } from "@/config";
import { getConfigValue } from "@/config/config";
import { MAX_DECIMALS } from "@/const";

//================================================================================================================================================================================//

export function getEnergyDataCollection(hass: HomeAssistant | undefined): EnergyCollection | undefined {
  if (!hass) {
    return undefined;
  }

  if (hass.panelUrl) {
    return hass.connection["_energy_" + hass.panelUrl];
  }

  return hass.connection["_energy"];
}

//================================================================================================================================================================================//

export function getEnergyPreferences(hass: HomeAssistant): Promise<EnergyPreferences> {
  return hass.callWS<EnergyPreferences>({
    type: "energy/get_prefs",
  });
}

//================================================================================================================================================================================//

export function getDisplayPrecisionForEnergyState(state: Decimal, energyUnitsConfig: EnergyUnitsConfig[]): number {
  const displayPrecisionUnder10: number = Math.max(Math.min(getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Under_10), MAX_DECIMALS), 0);
  const displayPrecisionUnder100: number = Math.max(Math.min(getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Under_100), MAX_DECIMALS), 0);
  const displayPrecision: number = Math.max(Math.min(getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Display_Precision_Default), MAX_DECIMALS), 0);

  return state.lessThan(10) ? displayPrecisionUnder10 : state.lessThan(100) ? displayPrecisionUnder100 : displayPrecision;
}

//================================================================================================================================================================================//

export function calculateEnergyUnitPrefix(value: Decimal, prefixThreshold: Decimal, energyUnitsConfig: EnergyUnitsConfig[]): SIUnitPrefixes {
  const prefixes: SIUnitPrefixes[] = Object.values(SIUnitPrefixes);

  value = value.abs();
  value = value.toDecimalPlaces(getDisplayPrecisionForEnergyState(value, energyUnitsConfig));

  for (let n: number = 0; n < prefixes.length; n++) {
    if (value.lessThan(prefixThreshold)) {
      return prefixes[n];
    }

    value = value.dividedBy(1000);
    value = value.toDecimalPlaces(getDisplayPrecisionForEnergyState(value, energyUnitsConfig));
  }

  return prefixes[prefixes.length - 1];
}

//================================================================================================================================================================================//
