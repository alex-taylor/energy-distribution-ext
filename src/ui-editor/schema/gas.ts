import { EditorPages, EnergyDistributionExtConfig, GasConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { DisplayMode, GAS_ENTITY_CLASSES } from '@/enums';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

//================================================================================================================================================================================//

export const gasSchema = memoizeOne((config: EnergyDistributionExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const gasConfig: GasConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Gas);
  return nodeConfigSchema(singleValueNodeSchema(gasConfig, mode, EditorPages.Gas, GAS_ENTITY_CLASSES), secondaryEntities);
});

//================================================================================================================================================================================//
