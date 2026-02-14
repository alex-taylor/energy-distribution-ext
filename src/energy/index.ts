import { HomeAssistant } from 'custom-card-helpers';
import { EnergyCollection } from '@/hass';

//================================================================================================================================================================================//

export function getEnergyDataCollection(hass: HomeAssistant | undefined): EnergyCollection | undefined {
  return hass ? hass.connection["_energy"] : undefined; 
}

//================================================================================================================================================================================//
