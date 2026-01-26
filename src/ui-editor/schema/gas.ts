import { EditorPages, EnergyFlowCardExtConfig, GasConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { GAS_ENTITY_CLASSES } from '@/enums';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const gasSchema = memoizeOne((config: EnergyFlowCardExtConfig, secondaryEntities: string[]): any[] => {
  const gasConfig: GasConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Gas);
  return nodeConfigSchema(singleValueNodeSchema(gasConfig, EditorPages.Gas, GAS_ENTITY_CLASSES), secondaryEntities);
});
