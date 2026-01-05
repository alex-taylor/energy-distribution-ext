import { HomeAssistant } from 'custom-card-helpers';
import { EnergyCollection } from '@/hass';

export function getEnergyDataCollection(hass: HomeAssistant | undefined, key: string = '_energy'): EnergyCollection | undefined {
  return hass ? hass.connection[key] : undefined; 
};
