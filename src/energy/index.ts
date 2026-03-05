import { HomeAssistant } from 'custom-card-helpers';
import { EnergyCollection, EnergyPreferences } from '@/hass';
import { SIUnitPrefixes } from "@/enums";
import { Decimal } from "decimal.js";

//================================================================================================================================================================================//

export function getEnergyDataCollection(hass: HomeAssistant | undefined): EnergyCollection | undefined {
  return hass ? hass.connection["_energy"] : undefined; 
}

//================================================================================================================================================================================//

export function getEnergyPreferences(hass: HomeAssistant): Promise<EnergyPreferences> {
  return hass.callWS<EnergyPreferences>({
    type: "energy/get_prefs",
  });
}

//================================================================================================================================================================================//

export function calculateEnergyUnitPrefix(value: Decimal, prefixThreshold: Decimal): SIUnitPrefixes {
  const prefixes: SIUnitPrefixes[] = Object.values(SIUnitPrefixes);

  value = value.abs().toDecimalPlaces(0);

  for (let n: number = 0; n < prefixes.length; n++) {
    if (value.lessThan(prefixThreshold)) {
      return prefixes[n];
    }

    value = value.dividedBy(1000);
  }

  return prefixes[prefixes.length - 1];
}

//================================================================================================================================================================================//
