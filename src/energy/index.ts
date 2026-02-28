import { HomeAssistant } from 'custom-card-helpers';
import { EnergyCollection, EnergyPreferences } from '@/hass';

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
